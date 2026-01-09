import type { SuperAgentTest } from "supertest";

export const TEST_ADMIN = {
  username: "testadmin",
  password: "testpassword123",
};

export async function loginAsAdmin(agent: SuperAgentTest): Promise<SuperAgentTest> {
  await agent
    .post("/api/auth/login")
    .send(TEST_ADMIN)
    .expect(200);
  return agent;
}

export async function loginAsSeller(agent: SuperAgentTest, phone: string): Promise<SuperAgentTest> {
  await agent
    .post("/api/seller/send-code")
    .send({ phone })
    .expect(200);
  return agent;
}
