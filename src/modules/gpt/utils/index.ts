import { FileDiffResult } from '../../gitlab/interfaces';
import { MRFileVersions } from '../../gitlab/interfaces/merge-request-file-version';
import { Severity } from '../../gitlab/enums';

export const parseJSONResponse = (response: string): any => {
  response = parseTextResponse(response);
  return JSON.parse(response.trim());
};

export const parseTextResponse = (response: string): string => {
  // ignore the first line if it ends with a colon
  response = response.trim();
  if (response.split('\n')[0].endsWith(':')) {
    response = response.split('\n').slice(1).join('\n').trim();
  }

  return response;
};

export const initPromt = (
  paths: FileDiffResult,
  versions: MRFileVersions,
  _minSeverity: Severity = Severity.low,
): string => {
  let query = `I am reviewing a merge request. Please review the changes to the file ${paths.newPath}:\n\n`;

  if (versions.oldFile) {
    query += `Old version:\n\n${versions.oldFile}\n\n`;
    query += `New version:\n\n${versions.newFile}\n\n`;
  } else {
    query += `New file:\n\n${versions.newFile}\n\n`;
  }

  query +=
    `Please create a list of any issues you see with the code. Only include issues where you are really confident that they should be improved.` +
    `The code should be more readable and please give some suggest to improve the coding convention and logic. For example, the if statement should not be too complicated` +
    `If no such issues exist, leave the list empty. Ignore any issues related to imports from other files. The issues should have the following format (it's fine to create multiple comments on the same line):\n\n`;

  query += `[
    {
      "comment": "This is the first comment",
      "severity": "medium",
      "refersTo": "  foo = bar[baz];"
    },
    {
      "comment": "This is the second comment",
      "severity": "high",
      "refersTo": "for (const foo of bar) {\\n  baz();\\n}"
    }
  ]`;

  return query;
};
