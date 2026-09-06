import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/auth/rate-limit";
import { isDatabaseConfigured } from "@/db";
import { submitFeedback, MAX_MESSAGE_LENGTH } from "@/feedback";

const submitSchema = z.object({
	message: z
		.string()
		.min(1, "Message is required")
		.max(MAX_MESSAGE_LENGTH, "Message too long"),
});

export async function POST(request: NextRequest) {
	if (!isDatabaseConfigured()) {
		return NextResponse.json(
			{
				error: "Feedback is not configured",
				message:
					"This OpenCut instance runs without a database, so feedback " +
					"cannot be stored. Set DATABASE_URL to enable it.",
			},
			{ status: 503 },
		);
	}

	const { limited } = await checkRateLimit({ request });
	if (limited) {
		return NextResponse.json({ error: "Too many requests" }, { status: 429 });
	}

	const body = await request.json();
	const result = submitSchema.safeParse(body);

	if (!result.success) {
		return NextResponse.json(
			{ error: "Invalid input", details: result.error.flatten().fieldErrors },
			{ status: 400 },
		);
	}

	const entry = await submitFeedback(result.data);
	return NextResponse.json({ entry }, { status: 201 });
}
