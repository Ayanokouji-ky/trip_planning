import { Button, Card, Col, Row, Typography } from 'antd';
import { RobotOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Disclaimer from '@/components/common/Disclaimer';

const { Title, Paragraph } = Typography;

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <Disclaimer />
      <Card style={{ marginTop: 24, textAlign: 'center', padding: '24px 0' }}>
        <Title level={2}>AI 旅游行程规划</Title>
        <Paragraph type="secondary" style={{ fontSize: 16 }}>
          输入旅行需求，AI 自动生成结构化攻略，地图可视化展示行程节点与路线
        </Paragraph>
        <Row gutter={16} justify="center" style={{ marginTop: 24 }}>
          <Col>
            <Button
              type="primary"
              size="large"
              icon={<RobotOutlined />}
              onClick={() => navigate('/generate')}
            >
              开始生成行程
            </Button>
          </Col>
          <Col>
            <Button
              size="large"
              icon={<UnorderedListOutlined />}
              onClick={() => navigate('/plans')}
            >
              查看我的行程
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
