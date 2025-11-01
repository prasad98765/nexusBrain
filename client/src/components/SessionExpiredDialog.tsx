import { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { setSessionExpiredDialogHandler } from '@/lib/apiClient';
import { AlertCircle } from 'lucide-react';

interface SessionExpiredDialogProps {
    isOpen: boolean;
    onClose: () => void;
    children?: React.ReactNode;
}

export const SessionExpiredDialog = ({ isOpen, onClose, children }: SessionExpiredDialogProps) => {
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                            <AlertCircle className="h-6 w-6 text-red-500" />
                        </div>
                        <AlertDialogTitle className="text-xl">Session Expired</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-slate-300">
                        Your session has expired or your token is invalid. Please log in again to continue.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction
                        onClick={() => {
                            onClose();
                            window.location.href = '/auth';
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        Go to Login
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
