import {
  EnvironmentOutlined,
  InfoCircleOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';

export type BottomTab = 'map' | 'list' | 'detail';

interface Props {
  active: BottomTab;
  onChange: (tab: BottomTab) => void;
}

const ITEMS: { key: BottomTab; icon: React.ReactNode; label: string }[] = [
  { key: 'map', icon: <EnvironmentOutlined />, label: '地图' },
  { key: 'list', icon: <UnorderedListOutlined />, label: '列表' },
  { key: 'detail', icon: <InfoCircleOutlined />, label: '详情' },
];

/** 窄屏底部 Tab 栏：地图 / 列表 / 详情，固定底部 + 刘海屏安全区 */
export default function BottomTabBar({ active, onChange }: Props) {
  return (
    <nav className="bottom-tab-bar">
      {ITEMS.map((item) => (
        <div
          key={item.key}
          className={`bottom-tab-item${active === item.key ? ' active' : ''}`}
          onClick={() => onChange(item.key)}
        >
          {item.icon}
          <span>{item.label}</span>
        </div>
      ))}
    </nav>
  );
}
