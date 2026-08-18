import { useState } from 'react';
import { Modal, Select, Typography, Space } from 'antd';
import { BellOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Props {
  open: boolean;
  descricao: string;
  onConfirm: (dias: number) => void;
  onSkip: () => void;
}

const INTERVALOS = [
  { value: 1,  label: '1 dia'     },
  { value: 2,  label: '2 dias'    },
  { value: 3,  label: '3 dias'    },
  { value: 5,  label: '5 dias'    },
  { value: 7,  label: '1 semana'  },
  { value: 14, label: '2 semanas' },
  { value: 30, label: '1 mês'     },
];

function somarDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toLocaleDateString('pt-BR');
}

export default function FollowUpModal({ open, descricao, onConfirm, onSkip }: Props) {
  const [dias, setDias] = useState(3);

  return (
    <Modal
      open={open}
      title={
        <Space>
          <BellOutlined style={{ color: '#6C2BD9' }} />
          <span>Agendar próximo follow-up?</span>
        </Space>
      }
      okText="Sim, agendar"
      cancelText="Não, obrigado"
      okButtonProps={{ style: { background: '#6C2BD9', borderColor: '#6C2BD9' } }}
      onOk={() => onConfirm(dias)}
      onCancel={onSkip}
      width={420}
    >
      <div style={{ padding: '8px 0' }}>
        <Text style={{ display: 'block', marginBottom: 16, color: '#555' }}>
          ✅ Tarefa concluída: <Text strong>"{descricao}"</Text>
        </Text>
        <Text style={{ display: 'block', marginBottom: 10 }}>
          Deseja cobrar novamente daqui a:
        </Text>
        <Space>
          <Select
            value={dias}
            onChange={setDias}
            style={{ width: 140 }}
            options={INTERVALOS}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            → {somarDias(dias)}
          </Text>
        </Space>
      </div>
    </Modal>
  );
}
