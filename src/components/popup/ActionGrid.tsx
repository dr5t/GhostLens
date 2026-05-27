import { motion } from 'framer-motion';
import { AI_ACTIONS, type AIAction } from '../../types';
import './ActionGrid.css';

interface ActionGridProps {
  onAction: (action: AIAction) => void;
}

export function ActionGrid({ onAction }: ActionGridProps) {
  return (
    <div className="action-grid">
      {AI_ACTIONS.map((action, index) => (
        <motion.button
          key={action.id}
          className="action-btn glass glass-hover"
          onClick={() => onAction(action.id)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04, duration: 0.25 }}
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          title={action.description}
        >
          <span className="action-icon">{action.icon}</span>
          <span className="action-label">{action.label}</span>
        </motion.button>
      ))}
    </div>
  );
}
