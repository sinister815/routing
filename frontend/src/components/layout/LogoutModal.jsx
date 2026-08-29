import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LogOut, AlertTriangle } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { closeLogoutModal } from '../../store/slices/uiSlice.js';
import { logoutUser } from '../../store/slices/authSlice.js';
import { useNavigate } from 'react-router-dom';

export default function LogoutModal() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isOpen = useSelector((state) => state.ui.isLogoutModalOpen);

  const handleConfirmLogout = async () => {
    await dispatch(logoutUser());
    dispatch(closeLogoutModal());
    navigate('/login');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => dispatch(closeLogoutModal())}
      title="Sign Out Confirmation"
      subtitle="Are you sure you want to end your current session?"
      icon={LogOut}
      maxWidth="max-w-sm"
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-600">
          You will need to sign in again to access campaign metrics, tracking links, and live postback streams.
        </p>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch(closeLogoutModal())}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleConfirmLogout}
            icon={LogOut}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </Modal>
  );
}
