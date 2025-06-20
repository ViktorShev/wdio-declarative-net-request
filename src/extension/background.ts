// @ts-expect-error -- Rules will exist at runtime
import rules from './rules';

chrome.declarativeNetRequest.updateDynamicRules({
  removeRuleIds: rules.map((rule: chrome.declarativeNetRequest.Rule) => rule.id),
  addRules: rules
});
