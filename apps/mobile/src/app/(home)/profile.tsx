import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { authClient, doAuthLogout } from "~/utils/auth-client";

export default function Profile() {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  async function handleLogout() {
    await doAuthLogout();
    router.replace("../../login");
  }

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 p-6">
        <Text className="mb-4 text-3xl" type={"title"}>
          Profile
        </Text>

        <View className="mb-4 rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
          <Text className="mb-2 text-lg">User Information</Text>
          <Text>Name: {session?.user.name ?? "Not available"}</Text>
          <Text>Email: {session?.user.email ?? "Not available"}</Text>
        </View>

        <Button variant={"destructive"} onPress={() => handleLogout()}>
          <Text>Sign Out</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
