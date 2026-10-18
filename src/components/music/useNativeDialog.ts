import { useEffect, type RefObject } from 'react';
import { mountNativeDialog } from '../../lib/native-dialog';
export { cancelNativeDialog } from '../../lib/native-dialog';

export function useNativeDialog(dialog: RefObject<HTMLDialogElement | null>, open = true, initialFocus?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (open && dialog.current) return mountNativeDialog(dialog.current, initialFocus?.current);
  }, [dialog, open, initialFocus]);
}
