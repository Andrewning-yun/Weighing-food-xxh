import { MessagePlugin, DialogPlugin } from 'tdesign-react';

export const toast = {
  success(message: string) {
    MessagePlugin.success(message);
  },
  error(message: string) {
    MessagePlugin.error(message);
  },
  warning(message: string) {
    MessagePlugin.warning(message);
  },
  info(message: string) {
    MessagePlugin.info(message);
  },
  confirm(options: {
    title: string;
    content: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
  }) {
    const dialog = DialogPlugin.confirm({
      header: options.title,
      body: options.content,
      confirmBtn: options.confirmText || '确认',
      cancelBtn: options.cancelText || '取消',
      onConfirm: async () => {
        try {
          await options.onConfirm();
          dialog.hide();
        } catch {
          // 确认操作失败时不关闭弹窗，让调用方处理错误提示
        }
      },
      onCancel: () => {
        options.onCancel?.();
        dialog.hide();
      },
      onClose: () => {
        dialog.hide();
      },
    });
    return dialog;
  },
};
