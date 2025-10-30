import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { joinGroup } from '@/lib/queries';

interface JoinGroupModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function JoinGroupModal({ onClose, onSuccess }: JoinGroupModalProps) {
  const [inviteCode, setInviteCode] = useState('');

  const { mutate: join, isPending, isError, error } = useMutation({
    mutationFn: () => joinGroup(inviteCode.trim()),
    onSuccess: () => {
      onSuccess();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteCode.trim()) {
      join();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Join Group</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="inviteCode" className="block text-sm font-medium mb-2">
              Invite Code
            </label>
            <Input
              id="inviteCode"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.trim())}
              placeholder="e.g., J6tPvG"
              required
              className="w-full font-mono"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2">
              Enter the 6-character invite code shared by the group owner
            </p>
          </div>

          {isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">
                {error instanceof Error && error.message.includes('404')
                  ? 'Invalid invite code. Please check and try again.'
                  : error instanceof Error && error.message.includes('400')
                  ? 'You are already a member of this group.'
                  : 'Failed to join group. Please try again.'}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isPending || !inviteCode.trim()}
            >
              {isPending ? 'Joining...' : 'Join Group'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
