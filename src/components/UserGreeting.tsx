import React from 'react';
import { useEncryptedContext } from '../hooks/useEncryptedContext';

interface UserGreetingProps {
  className?: string;
}

const UserGreeting: React.FC<UserGreetingProps> = ({ className = '' }) => {
  const { userName, evseReference, isLoading } = useEncryptedContext();

  if (isLoading) {
    return <div className={className}>Loading user information...</div>;
  }

  return (
    <div className={className}>
      <h2>Hi {userName}!</h2>
      {evseReference && (
        <p>You've selected charging station: <strong>{evseReference}</strong></p>
      )}
    </div>
  );
};

export default UserGreeting;
