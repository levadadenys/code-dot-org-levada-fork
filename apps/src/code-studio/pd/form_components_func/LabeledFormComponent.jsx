import React, {useContext} from 'react';
import SafeMarkdown from '@cdo/apps/templates/SafeMarkdown';

// Containers of labeled form components should provide this context
// using <LabelsContext.Provider value={context}>
// The format of the context is { labelName: labelString }
export const LabelsContext = React.createContext({});

// UI Helpers
export const labelFor = name => {
  // TODO: Fix the usage of useContext and remove next line
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const labels = useContext(LabelsContext);
  if (!(name in labels)) {
    console.warn(`Label missing for ${name}`);
    return name;
  }

  return (
    // SafeMarkdown wraps markdown in a <div> and uses <p> tags for each
    // paragraph, but the form system was built using a prior markdown
    // renderer which didn't do that for single-line entries, and so we rely
    // on some CSS styling in pd.scss to set these elements to
    // "display: inline" to maintain backwards compatibility.
    <div className="inline_markdown">
      <SafeMarkdown openExternalLinksInNewTab markdown={labels[name]} />
    </div>
  );
};

export const defaultOptions = (name, label) => {
  return {
    name,
    label: label || labelFor(name),
    controlWidth: {md: 6},
    required: true
  };
};
