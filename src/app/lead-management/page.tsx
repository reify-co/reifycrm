import React from 'react';
import AppLayout from '@/components/AppLayout';
import LeadManagementClient from './components/LeadManagementClient';

export default function LeadManagementPage() {
  return (
    <AppLayout>
      <LeadManagementClient />
    </AppLayout>
  );
}