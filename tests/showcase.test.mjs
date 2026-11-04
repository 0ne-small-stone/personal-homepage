import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { showcaseWorks, videoSource, workCover, workImageSize } from '../src/data/showcase.ts';

test('作品具有唯一稳定路由，原创封面文件存在', () => {
  const slugs = showcaseWorks.map(work => work.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const work of showcaseWorks) {
    assert.match(work.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(work.title && work.description && work.sections.length);
    if (!work.cover.startsWith('https://')) {
      assert.ok(existsSync(new URL(`../public/showcase/covers/${work.cover}`, import.meta.url)), work.cover);
      assert.ok(work.coverNote.includes('示意'));
    }
  }
});

test('用户给出的两个视频保留正确ID，按需播放器不自动播放', () => {
  const supplied = ['BV1gu4y1s7YC', 'BV1tU411o7Na'];
  const videos = showcaseWorks.filter(work => work.video);
  for (const id of supplied) {
    const work = videos.find(work => work.video.bvid === id);
    assert.ok(work, id);
    const player = new URL(videoSource(id));
    assert.equal(player.origin, 'https://player.bilibili.com');
    assert.equal(player.searchParams.get('bvid'), id);
    assert.equal(player.searchParams.get('autoplay'), '0');
    assert.ok(work.video.owner && work.video.duration);
  }
  assert.throws(() => videoSource('https://example.com/'));
  assert.throws(() => videoSource('BV1gu4y1s7YC&autoplay=1'));
});

test('子路径封面地址正确，外部封面保持HTTPS与原始URL', () => {
  const project = showcaseWorks.find(work => !work.video);
  assert.equal(workCover(project, '/personal-homepage/'), `/personal-homepage/showcase/covers/${project.cover}`);
  const video = showcaseWorks.find(work => work.video);
  assert.equal(workCover(video, '/personal-homepage/'), video.cover);
  assert.equal(new URL(video.cover).protocol, 'https:');
});

test('封面保留自身画幅，非法尺寸不会进入页面', () => {
  const work = showcaseWorks[0];
  assert.equal(workImageSize(work).format, 'landscape');
  assert.deepEqual(workImageSize({ ...work, coverSize: { width: 1080, height: 1920 } }), { width: 1080, height: 1920, format: 'portrait' });
  assert.equal(workImageSize({ ...work, coverSize: { width: 1200, height: 1200 } }).format, 'square');
  assert.throws(() => workImageSize({ ...work, coverSize: { width: 0, height: 900 } }));
});

test('两段影像保留用户确认的参与职责，并与发布者署名分开', () => {
  const opening = showcaseWorks.find(work => work.slug === 'opening-performance');
  const wolf = showcaseWorks.find(work => work.slug === 'the-wolf');
  assert.match(opening.contribution, /乐社社长/);
  assert.match(opening.contribution, /方阵总策划/);
  assert.match(wolf.contribution, /导演.*主演/);
  assert.equal(opening.video.owner, 'lonelyheartsband');
  assert.equal(wolf.video.owner, 'M42_THU');
  for (const work of [opening, wolf]) assert.ok(work.sections.every(section => !section.paragraphs.some(text => text.includes('整理后补充'))));
});
