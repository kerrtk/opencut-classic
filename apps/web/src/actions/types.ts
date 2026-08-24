import type { MutableRefObject } from "react";
import { ACTIONS } from "./definitions";
import type { TAction } from "./definitions";

export type { TAction };

export type TActionArgsMap = {
	"seek-forward": { seconds: number } | undefined;
	"seek-backward": { seconds: number } | undefined;
	"jump-forward": { seconds: number } | undefined;
	"jump-backward": { seconds: number } | undefined;
	"remove-media-asset": { projectId: string; assetId: string };
	"remove-media-assets": { projectId: string; assetIds: string[] };
};

type TKeysWithValueUndefined<T> = {
	[K in keyof T]: undefined extends T[K] ? K : never;
}[keyof T];

export type TActionWithArgs = keyof TActionArgsMap;

export type TActionWithOptionalArgs =
	| TActionWithNoArgs
	| TKeysWithValueUndefined<TActionArgsMap>;

export type TActionWithNoArgs = Exclude<TAction, TActionWithArgs>;

export type TArgOfAction<A extends TAction> = A extends TActionWithArgs
	? TActionArgsMap[A]
	: undefined;

export type TActionFunc<A extends TAction> = A extends TActionWithArgs
	? (arg: TArgOfAction<A>, trigger?: TInvocationTrigger) => void
	: (_?: undefined, trigger?: TInvocationTrigger) => void;

export type TInvocationTrigger = "keypress" | "mouseclick";

export type TBoundActionList = {
	[A in TAction]?: Array<TActionFunc<A>>;
};

export type TActionHandlerOptions =
	| MutableRefObject<boolean>
	| boolean
	| undefined;

// Actions whose args are required (i.e. NOT optional/undefined-compatible in
// TActionArgsMap) and therefore excluded from TActionWithOptionalArgs.
const ACTIONS_REQUIRING_ARGS = new Set<string>(
	["remove-media-asset", "remove-media-assets"] satisfies Exclude<
		TActionWithArgs,
		TActionWithOptionalArgs
	>[],
);

const ALL_ACTIONS_SET: ReadonlySet<string> = new Set(Object.keys(ACTIONS));

export function isActionWithOptionalArgs(
	value: unknown,
): value is TActionWithOptionalArgs {
	return (
		typeof value === "string" &&
		ALL_ACTIONS_SET.has(value) &&
		!ACTIONS_REQUIRING_ARGS.has(value)
	);
}
