'use client';

import { useCallback } from 'react';
import { Button } from 'tdesign-react/es/button';
import { DialogPlugin } from 'tdesign-react/es/dialog';
import type { ButtonProps } from 'tdesign-react/es/button';

export interface ConfirmButtonProps extends Omit<ButtonProps, 'onClick'> {
  confirmTitle?: string;
  confirmContent?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
}

/**
 * Button that shows a confirmation dialog before executing the action.
 * Ideal for destructive operations (delete, deactivate, etc.).
 * Automatically shows loading state during async onConfirm.
 */
export function ConfirmButton({
  confirmTitle = '确认操作',
  confirmContent = '确定要执行此操作吗？',
  confirmText = '确认',
  cancelText = '取消',
  danger = false,
  onConfirm,
  children,
  ...buttonProps
}: ConfirmButtonProps) {
  const handleClick = useCallback(() => {
    const dialog = DialogPlugin.confirm({
      header: confirmTitle,
      body: confirmContent,
      confirmBtn: confirmText,
      cancelBtn: cancelText,
      theme: danger ? 'danger' : 'warning',
      onConfirm: async () => {
        try {
          await onConfirm();
          dialog.hide();
        } catch {
          // 让调用方处理错误提示，不关闭弹窗
        }
      },
      onCancel: () => dialog.hide(),
      onClose: () => dialog.hide(),
    });
  }, [confirmTitle, confirmContent, confirmText, cancelText, danger, onConfirm]);

  return (
    <Button {...buttonProps} onClick={handleClick}>
      {children}
    </Button>
  );
}
