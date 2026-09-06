import { NextResponse } from "next/server";
import { getAuth, isAuthConfigured } from "@/auth/server";
import { toNextJsHandler } from "better-auth/next-js";

function authUnavailable() {
	return NextResponse.json(
		{
			error: "Authentication is not configured",
			message:
				"This OpenCut instance runs without a database, so accounts are " +
				"disabled. Projects are saved locally in your browser.",
		},
		{ status: 503 },
	);
}

export async function GET(request: Request) {
	if (!isAuthConfigured()) {
		return authUnavailable();
	}

	return toNextJsHandler(getAuth()).GET(request);
}

export async function POST(request: Request) {
	if (!isAuthConfigured()) {
		return authUnavailable();
	}

	return toNextJsHandler(getAuth()).POST(request);
}
