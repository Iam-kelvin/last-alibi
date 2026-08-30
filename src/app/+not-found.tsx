import { router } from 'expo-router';

import { Button, EmptyState, Screen } from '@/components/ui';

export default function NotFoundScreen() {
  return (
    <Screen>
      <EmptyState icon="compass-outline" title="No case at this address" message="The requested screen is not part of the current archive." action={<Button label="Return to the detective desk" onPress={() => router.replace('/')} />} />
    </Screen>
  );
}
