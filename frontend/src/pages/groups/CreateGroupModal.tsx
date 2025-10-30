import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { createGroup } from '@/lib/queries';

interface CreateGroupModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateGroupModal({ onClose, onSuccess }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const { mutate: create, isPending, isError, error } = useMutation({
    mutationFn: () => createGroup(name, description || undefined),
    onSuccess: () => {
      onSuccess();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length >= 3) {
      create();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Create Group</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Group Name *
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sunday Sharps"
              required
              minLength={3}
              maxLength={50}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              3-50 characters
            </p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Weekend NFL betting competition"
              maxLength={200}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length}/200 characters
            </p>
          </div>

          {isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">
                {error instanceof Error ? error.message : 'Failed to create group'}
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
              disabled={isPending || name.trim().length < 3}
            >
              {isPending ? 'Creating...' : 'Create Group'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
