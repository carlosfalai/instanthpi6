import { SpruceHealthClient } from "../server/spruce-health-client";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

async function testSpruceConnection() {
  console.log("🔧 Testing Spruce Health API Connection...\n");

  const bearerToken = process.env.SPRUCE_BEARER_TOKEN || process.env.SPRUCE_API_KEY;
  const accessId = process.env.SPRUCE_ACCESS_ID;

  if (!bearerToken) {
    console.error("❌ SPRUCE_BEARER_TOKEN or SPRUCE_API_KEY not found in environment variables");
    process.exit(1);
  }

  console.log("✅ Token found:", bearerToken.substring(0, 10) + "...");

  const client = new SpruceHealthClient({
    bearerToken: bearerToken,
  });

  try {
    console.log("\n📋 Test 1: Fetching conversations...");
    const conversations = await client.getConversations({ per_page: 5 });
    console.log(`✅ Success! Found ${conversations.conversations.length} conversations`);

    if (conversations.conversations.length > 0) {
      const firstConv = conversations.conversations[0];
      console.log(`📝 First conversation: ID=${firstConv.id}, Title="${firstConv.title}"`);

      console.log("\n💬 Test 2: Fetching messages from first conversation...");
      const messages = await client.getMessages(firstConv.id, { per_page: 5 });
      console.log(`✅ Success! Found ${messages.messages.length} messages`);

      if (messages.messages.length > 0) {
        const firstMessage = messages.messages[0];
        console.log(`📝 Message preview: "${firstMessage.content.substring(0, 50)}..."`);
        console.log(`👤 Sender: ${firstMessage.sender_name}`);
      }
    }

    console.log("\n🎉 Connection verified successfully!");
  } catch (error: any) {
    console.error("\n❌ API connection failed:");
    console.error("Error:", error.message);
    if (error.response?.data) {
      console.error("Details:", JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testSpruceConnection();
