import { DialogPlugin } from 'tdesign-react';

export interface DeleteConfirmOptions {
  title?: string;
  content?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
}

export function showDeleteConfirm(options: DeleteConfirmOptions) {
  const dialog = DialogPlugin.confirm({
    header: options.title || '确认删除',
    body: options.content || '删除后将无法恢复，确定要删除吗？',
    confirmBtn: options.confirmText || '删除',
    cancelBtn: options.cancelText || '取消',
    theme: 'danger',
    onConfirm: async () => {
      try {
        await options.onConfirm();
        dialog.hide();
      } catch {
        // 删除失败时不关闭弹窗
      }
    },
    onCancel: () => {
      dialog.hide();
    },
    onClose: () => {
      dialog.hide();
    },
  });
  return dialog;
}
