import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getGroups } from '@/lib/queries';
import CreateGroupModal from './CreateGroupModal';
import JoinGroupModal from './JoinGroupModal';

export default function GroupsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const { data: groups, isLoading, refetch } = useQuery({
    queryKey: ['groups'],
    queryFn: getGroups
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Groups</h1>
            <p className="text-gray-600 mt-1">
              Compete with friends and track your performance
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowCreate(true)}>
              Create Group
            </Button>
            <Button variant="outline" onClick={() => setShowJoin(true)}>
              Join Group
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading groups...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && groups && groups.length === 0 && (
          <Card className="p-12 text-center border-dashed">
            <div className="max-w-md mx-auto space-y-4">
              <div className="text-6xl">👥</div>
              <h3 className="text-xl font-semibold">No Groups Yet</h3>
              <p className="text-gray-600">
                You haven't joined any groups yet. Create one to compete with friends or join an existing group with an invite code!
              </p>
              <div className="flex gap-2 justify-center pt-4">
                <Button onClick={() => setShowCreate(true)}>
                  Create Your First Group
                </Button>
                <Button variant="outline" onClick={() => setShowJoin(true)}>
                  Join a Group
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Groups Grid */}
        {!isLoading && groups && groups.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group: any) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        )}

        {/* Modals */}
        {showCreate && (
          <CreateGroupModal
            onClose={() => setShowCreate(false)}
            onSuccess={() => {
              setShowCreate(false);
              refetch();
            }}
          />
        )}
        {showJoin && (
          <JoinGroupModal
            onClose={() => setShowJoin(false)}
            onSuccess={() => {
              setShowJoin(false);
              refetch();
            }}
          />
        )}
      </div>
    </Layout>
  );
}

function GroupCard({ group }: { group: any }) {
  return (
    <Link to={`/groups/${group.id}`}>
      <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer h-full">
        <CardHeader>
          <CardTitle className="text-xl">{group.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {group.description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {group.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>{group.member_count} {group.member_count === 1 ? 'member' : 'members'}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Invite:</span>
              <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded border">
                {group.invite_code}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
