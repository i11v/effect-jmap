/**
 * Posts JMAP spec coverage report as a PR comment.
 *
 * @param {object} params
 * @param {import('@actions/github/lib/utils').GitHub} params.github
 * @param {import('@actions/github').context} params.context
 */
module.exports = async ({ github, context }) => {
  const report = process.env.COVERAGE_REPORT;

  if (!report) {
    console.log('No coverage report found in COVERAGE_REPORT env var');
    return;
  }

  const body = `## JMAP Spec Coverage

\`\`\`
${report}
\`\`\`
`;

  const prNumber = context.payload.pull_request?.number;
  if (!prNumber) {
    console.log('Not a pull request context, skipping comment');
    return;
  }

  await github.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: prNumber,
    body
  });

  console.log('Coverage comment posted successfully');
};
