onst mediaEntries = await Promise.all(
		mediaIds.map(async (mediaId) => {
			const mediaMetadata = await mediaMetadataAdapter.get(mediaId);
			if (!mediaMetadata) {
				return null;
			}

			return [mediaId, mediaMetadata.type] as const;
		}),
	);

	return Object.fromEntries(
		mediaEntries.filter(
			(
				mediaEntry,
			): mediaEntry is readonly [
				string,
				V1ToV2Context["mediaTypesById"][string],
			] => mediaEntry !== null,
		),
	);
}

function collectLegacyMediaIds({
	legacyTracksBySceneId,
}: {
	legacyTracksBySceneId: V1ToV2Context["legacyTracksBySceneId"];
}): string[] {
	const mediaIds = new Set<string>();

	for (const tracks of Object.values(legacyTracksBySceneId)) {
		if (!Array.isArray(tracks)) {
			continue;
		}

		for (const track of tracks) {
			if (!isRecord(track) || track.type !== "media") {
				continue;
			}

			const elements = track.elements;
			if (!Array.isArray(elements)) {
				continue;
			}

			for (const element of elements) {
				if (!isRecord(element) || element.type !== "media") {
					continue;
				}

				if (typeof element.mediaId !== "string") {
					continue;
				}

				mediaIds.add(element.mediaId);
			}
		}
	}

	return Array.from(mediaIds);
}

async function deleteLegacyTimelineDbs({
	projectId,
	project,
}: {
	projectId: string;
	project: ProjectRecord;
}): Promise<void> {
	const dbNames = getLegacyTimelineDbNames({ projectId, project });
	await Promise.all(dbNames.map((dbName) => deleteDatabase({ dbName })));
}

function getLegacyTimelineDbNames({
	projectId,
	project,
}: {
	projectId: string;
	project: ProjectRecord;
}): string[] {
	const scenes = project.scenes;
	if (!Array.isArray(scenes)) {
		return [`video-editor-timelines-${projectId}`];
	}

	const sceneDbNames = scenes.flatMap((scene) => {
		if (!isRecord(scene)) {
			return [];
		}

		return typeof scene.id === "string"
			? [`video-editor-timelines-${projectId}-${scene.id}`]
			: [];
	});

	return [...sceneDbNames, `video-editor-timelines-${projectId}`];
}		),
	);
}

async function loadLegacyTracksForScene({
	projectId,
	sceneId,
	isMain,
}: {
	projectId: string;
	sceneId: string;
	isMain: boolean;
}): Promise<unknown[]> {
	const sceneDbName = `video-editor-timelines-${projectId}-${sceneId}`;
	const projectDbName = `video-editor-timelines-${projectId}`;

	const adapter = new IndexedDBAdapter<LegacyTimelineData>(
		sceneDbName,
		"timeline",
		1,
	);

	let data = await adapter.get("timeline");

	if (!data && isMain) {
		const projectAdapter = new IndexedDBAdapter<LegacyTimelineData>(
			projectDbName,
			"timeline",
			1,
		);
		data = await projectAdapter.get("timeline");
	}

	if (!data || !Array.isArray(data.tracks)) {
		return [];
	}

	return data.tracks;
}

async function loadMediaTypesById({
	projectId,
	legacyTracksBySceneId,
}: {
	projectId: string;
	legacyTracksBySceneId: V1ToV2Context["legacyTracksBySceneId"];
}): Promise<V1ToV2Context["mediaTypesById"]> {
	const mediaIds = collectLegacyMediaIds({ legacyTracksBySceneId });
	if (mediaIds.length === 0) {
		return {};
	}

	const mediaMetadataAdapter = new IndexedDBAdapter<MediaAssetData>(
		`video-editor-media-${projectId}`,
		"media-metadata",
		1,
	);

	const mediaEntries = await Promise.all(
		mediaIds.map(async (mediaId) => {
			const mediaMetadata = await mediaMetadataAdapter.get(mediaId);
			if (!mediaMetadata) {
				return null;
			}

			return [mediaId, mediaMetadata.type] as const;
		}),
	);

	return Object.fromEntries(
		mediaEntries.filter(
			(
				mediaEntry,
			): mediaEntry is readonly [
				string,
				V1ToV2Context["mediaTypesById"][string],
			] => mediaEntry !== null,
		),
	);
}

function collectLegacyMediaIds({
	legacyTracksBySceneId,
}: {
	legacyTracksBySceneId: V1ToV2Context["legacyTracksBySceneId"];
}): string[] {
	const mediaIds = new Set<string>();

	for (const tracks of Object.values(legacyTracksBySceneId)) {
		if (!Array.isArray(tracks)) {
			continue;
		}

		for (const track of tracks) {
			if (!isRecord(track) || track.type !== "media") {
				continue;
			}

			const elements = track.elements;
			if (!Array.isArray(elements)) {
				continue;
			}

			for (const element of elements) {
				if (!isRecord(element) || element.type !== "media") {
					continue;
				}

				if (typeof element.mediaId !== "string") {
					continue;
				}

				mediaIds.add(element.mediaId);
			}
		}
	}

	return Array.from(mediaIds);
}

async function deleteLegacyTimelineDbs({
	projectId,
	project,
}: {
	projectId: string;
	project: ProjectRecord;
}): Promise<void> {
	const dbNames = getLegacyTimelineDbNames({ projectId, project });
	await Promise.all(dbNames.map((dbName) => deleteDatabase({ dbName })));
}

function getLegacyTimelineDbNames({
	projectId,
	project,
}: {
	projectId: string;
	project: ProjectRecord;
}): string[] {
	const scenes = project.scenes;
	if (!Array.isArray(scenes)) {
		return [`video-editor-timelines-${projectId}`];
	}

	const sceneDbNames = scenes.flatMap((scene) => {
		if (!isRecord(scene)) {
			return [];
		}

		return typeof scene.id === "string"
			? [`video-editor-timelines-${projectId}-${scene.id}`]
			: [];
	});
	
