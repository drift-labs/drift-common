/**
 * Survey events use PostHog-reserved names with spaces (not snake_case).
 * These exact strings are required for PostHog's Surveys UI, response rate
 * tracking, and analytics to work. Do NOT rename them.
 * See: https://posthog.com/docs/surveys/implementing-custom-surveys
 */
export type SurveyEvents = {
	'survey shown': {
		$survey_id: string;
	};
	'survey dismissed': {
		$survey_id: string;
	};
	'survey sent': {
		$survey_id: string;
		[key: string]: unknown;
	};
};
