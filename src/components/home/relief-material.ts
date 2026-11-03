import { MeshBasicMaterial, SRGBColorSpace, Vector2, type Texture } from 'three';

export interface ReliefUniforms {
  light: { value: Vector2 };
  amount: { value: number };
  imageSize: { value: Vector2 };
}

const reliefShader = /* glsl */ `
uniform vec2 reliefLight;
uniform float reliefAmount;
uniform vec2 reliefImageSize;

float reliefLuma(vec3 color) {
  return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

#ifdef USE_MAP
float reliefHeight(vec2 uv) {
  // A color texture is sampled in linear space; pigment detection and the
  // apparent stone-height proxy both use its original sRGB values.
  vec4 linearSample = texture2D(map, clamp(uv, vec2(0.0), vec2(1.0)));
  return reliefLuma(sRGBTransferOETF(linearSample).rgb);
}
#endif
`;

const reliefMap = /* glsl */ `
#ifdef USE_MAP
  vec4 reliefSample = texture2D(map, vMapUv);
  #ifdef DECODE_VIDEO_TEXTURE
    reliefSample = sRGBTransferEOTF(reliefSample);
  #endif
  vec3 reliefSrgb = clamp(sRGBTransferOETF(reliefSample).rgb, 0.0, 1.0);

  // Warm neutral stone stays monochrome. The stronger warm pigment and the
  // blue/stone-cyan pigment are detected by their gamma-space red-blue gap.
  float reliefRedBlue = reliefSrgb.r - reliefSrgb.b;
  float reliefWarm = step(0.22, reliefRedBlue)
    * step(0.105, reliefSrgb.r - reliefSrgb.g);
  float reliefCool = step(0.04, -reliefRedBlue)
    * step(0.03, reliefSrgb.g - reliefSrgb.r);
  float reliefPigment = max(reliefWarm, reliefCool);

  vec2 reliefTexel = 1.0 / max(reliefImageSize, vec2(1.0));
  vec2 reliefGradient = vec2(
    reliefHeight(vMapUv + vec2(reliefTexel.x, 0.0))
      - reliefHeight(vMapUv - vec2(reliefTexel.x, 0.0)),
    reliefHeight(vMapUv + vec2(0.0, reliefTexel.y))
      - reliefHeight(vMapUv - vec2(0.0, reliefTexel.y))
  );
  vec2 reliefFixedLight = normalize(vec2(-0.65, 0.75));
  vec2 reliefRequestedLight = reliefLight / max(length(reliefLight), 0.001);
  vec2 reliefDirection = mix(reliefFixedLight, reliefRequestedLight,
    clamp(reliefAmount, 0.0, 1.0));
  reliefDirection /= max(length(reliefDirection), 0.001);
  float reliefEdge = clamp(dot(reliefGradient, reliefDirection) * 0.85,
    -0.065, 0.065);

  float reliefCoverage = step(0.48, reliefLuma(reliefSrgb) + reliefEdge);

  // No tinted gray, interpolated palette, noise, or time term: every shader
  // sample is one of the four linear endpoints before the standard output.
  vec3 reliefInk = reliefWarm >= reliefCool
    ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 0.0, 1.0);
  vec3 reliefPalette = reliefPigment > 0.5
    ? reliefInk : vec3(reliefCoverage);
  diffuseColor = vec4(reliefPalette, diffuseColor.a * reliefSample.a);
#endif
`;

export function createReliefMaterial(texture: Texture): MeshBasicMaterial {
  const image = texture.image as {
    width?: number;
    height?: number;
    naturalWidth?: number;
    naturalHeight?: number;
  } | null | undefined;
  const width = image?.naturalWidth || image?.width || 1600;
  const height = image?.naturalHeight || image?.height || 615;
  const uniforms: ReliefUniforms = {
    light: { value: new Vector2(-0.65, 0.75) },
    amount: { value: 0 },
    imageSize: { value: new Vector2(width, height) },
  };

  if (texture.colorSpace !== SRGBColorSpace) {
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
  }

  const material = new MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    fog: false,
    dithering: false,
  });
  material.userData.reliefUniforms = uniforms;
  material.onBeforeCompile = shader => {
    shader.uniforms.reliefLight = uniforms.light;
    shader.uniforms.reliefAmount = uniforms.amount;
    shader.uniforms.reliefImageSize = uniforms.imageSize;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <map_pars_fragment>',
        `#include <map_pars_fragment>\n${reliefShader}`)
      .replace('#include <map_fragment>', reliefMap);
  };
  material.customProgramCacheKey = () => 'home-relief-four-ink-cut-v2';
  return material;
}
