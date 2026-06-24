import { Popup } from '@nutui/nutui-react-taro';

export interface PopupPanelProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  compact?: boolean;
}

export function PopupPanel({ open, title, onClose, children, compact }: PopupPanelProps) {
  return (
    <Popup
      visible={open}
      position="bottom"
      title={title}
      closeable
      round
      destroyOnClose={false}
      onClose={onClose}
      style={compact ? { maxHeight: '50vh' } : { maxHeight: '80vh' }}
    >
      {children}
    </Popup>
  );
}

export default PopupPanel;
