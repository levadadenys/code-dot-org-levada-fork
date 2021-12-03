import React, {useState, useEffect} from 'react';
import PropTypes from 'prop-types';
import Button from '@cdo/apps/templates/Button';
import color from '@cdo/apps/util/color';
import i18n from '@cdo/locale';
import Spinner from '@cdo/apps/code-studio/pd/components/spinner';
import StylizedBaseDialog from '@cdo/apps/componentLibrary/StylizedBaseDialog';
import CodeReviewGroupsStatusToggle from '../codeReviewGroups/CodeReviewGroupsStatusToggle';
import CodeReviewGroupsManager from '@cdo/apps/templates/codeReviewGroups/CodeReviewGroupsManager';

const DIALOG_WIDTH = 1000;
const STATUS_MESSAGE_TIME_MS = 5000;

const SUBMIT_STATES = {
  DEFAULT: 'default',
  SUBMITTING: 'submitting',
  SUCCESS: 'success',
  ERROR: 'error'
};

const LOADING_STATES = {
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error'
};

export default function ManageCodeReviewGroups({
  buttonContainerStyle,
  dataApi
}) {
  const [groups, setGroups] = useState([]);
  const [groupsHaveChanged, setGroupsHaveChanged] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(SUBMIT_STATES.DEFAULT);
  const [loadingStatus, setLoadingStatus] = useState(LOADING_STATES.LOADING);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openDialog = () => setIsDialogOpen(true);
  const onDialogClose = () => setIsDialogOpen(false);

  const setGroupsWrapper = groups => {
    setGroupsHaveChanged(true);
    setGroups(groups);
  };

  useEffect(() => getInitialGroups(), [isDialogOpen]);

  const resetStatusAfterWait = () => {
    setTimeout(
      () => setSubmitStatus(SUBMIT_STATES.DEFAULT),
      STATUS_MESSAGE_TIME_MS
    );
  };

  const renderModalBody = () => {
    switch (loadingStatus) {
      case LOADING_STATES.LOADING:
        return <Spinner style={styles.spinner} size="medium" />;
      case LOADING_STATES.LOADED:
        return (
          <CodeReviewGroupsManager
            groups={groups}
            setGroups={setGroupsWrapper}
          />
        );
      case LOADING_STATES.ERROR:
        return (
          <span style={styles.errorMessageContainer}>
            {i18n.codeReviewGroupsLoadError()}
          </span>
        );
      default:
        return null;
    }
  };

  const renderSubmitStatus = () => {
    switch (submitStatus) {
      case SUBMIT_STATES.SUCCESS:
        return (
          <span style={styles.successMessageContainer}>
            <i className={'fa fa-check fa-lg'} style={styles.checkIcon} />
            {i18n.codeReviewGroupsSaveSuccess()}
          </span>
        );
      case SUBMIT_STATES.SUBMITTING:
        return <Spinner style={styles.spinner} size="medium" />;
      case SUBMIT_STATES.ERROR:
        return (
          <span style={styles.errorMessageContainer}>
            {i18n.codeReviewGroupsSaveError()}
          </span>
        );
      default:
        return null;
    }
  };

  const renderFooter = buttons => {
    return (
      <>
        r
        <CodeReviewGroupsStatusToggle />
        <div>
          {renderSubmitStatus()}
          {buttons}
        </div>
      </>
    );
  };

  const getInitialGroups = () => {
    setLoadingStatus(LOADING_STATES.LOADING);
    dataApi.getCodeReviewGroups().then(
      groups => {
        setGroups(groups);
        setLoadingStatus(LOADING_STATES.LOADED);
      },
      () => setLoadingStatus(LOADING_STATES.ERROR)
    );
  };
  const submitNewGroups = () => {
    setSubmitStatus(SUBMIT_STATES.SUBMITTING);
    dataApi.setCodeReviewGroups(groups).then(
      () => {
        setGroupsHaveChanged(false);
        setSubmitStatus(SUBMIT_STATES.SUCCESS);
        resetStatusAfterWait();
      },
      () => {
        setSubmitStatus(SUBMIT_STATES.ERROR);
        resetStatusAfterWait();
      }
    );
  };

  return (
    <div style={{...styles.buttonContainer, ...buttonContainerStyle}}>
      {/* use div instead of button HTML element via __useDeprecatedTag
          for consistent spacing with other "buttons" in ManageStudentsTable header */}
      <Button
        __useDeprecatedTag
        onClick={openDialog}
        color={Button.ButtonColor.gray}
        text={i18n.manageCodeReviewGroups()}
        icon="comment"
      />
      <StylizedBaseDialog
        title={i18n.codeReviewGroups()}
        isOpen={isDialogOpen}
        handleClose={onDialogClose}
        handleConfirmation={submitNewGroups}
        fixedWidth={DIALOG_WIDTH}
        renderFooter={renderFooter}
        footerJustification="space-between"
        confirmationButtonText={i18n.confirmChanges()}
        disableConfirmationButton={!groupsHaveChanged}
      >
        {renderModalBody()}
      </StylizedBaseDialog>
    </div>
  );
}

ManageCodeReviewGroups.propTypes = {
  dataApi: PropTypes.object.isRequired,
  buttonContainerStyle: PropTypes.object
};

const styles = {
  buttonContainer: {
    marginLeft: 5
  },
  checkIcon: {
    padding: 5
  },
  successMessageContainer: {
    fontFamily: '"Gotham 5r", sans-serif',
    color: color.level_perfect
  },
  errorMessageContainer: {
    fontFamily: '"Gotham 5r", sans-serif',
    color: color.red
  }
};
