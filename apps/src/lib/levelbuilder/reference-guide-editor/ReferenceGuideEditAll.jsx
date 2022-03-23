import React, {useMemo, useCallback, useState} from 'react';
import PropTypes from 'prop-types';
import $ from 'jquery';
import {TextLink} from '@dsco_/link';
import FontAwesome from '@cdo/apps/templates/FontAwesome';
import {
  getGuideChildren,
  organizeReferenceGuides
} from './referenceGuideHelpers';

const MiniIconButton = ({icon, alt, func, href}) => (
  <TextLink
    onClick={func}
    href={href}
    icon={<FontAwesome icon={icon} title={alt} />}
  />
);
MiniIconButton.propTypes = {
  icon: FontAwesome.propTypes.icon,
  alt: PropTypes.string,
  func: PropTypes.func,
  href: PropTypes.string
};

export default function ReferenceGuideEditAll(props) {
  const {baseUrl, referenceGuides: initialReferenceGuides} = props;
  const [referenceGuides, setReferenceGuides] = useState(
    initialReferenceGuides
  );
  // useMemo here so that we only do the organizing once
  const organizedGuides = useMemo(
    () => organizeReferenceGuides(referenceGuides),
    [referenceGuides]
  );

  const deleteGuide = useCallback(
    guideKey => {
      setReferenceGuides([
        ...referenceGuides.filter(guide => guide.key !== guideKey)
      ]);
      fetch(`${baseUrl}/${guideKey}`, {
        method: 'DELETE',
        headers: {
          'content-type': 'application/json',
          'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
        }
      });
    },
    [referenceGuides, baseUrl]
  );

  // To move guides, we will swap the positions of guides in the direction we want to move.
  // The positions might sometimes have gaps (in the case of deletion or changing parents),
  // but if we swap position values, they'll still sort correctly.
  // Using this strategy, we don't need to update the positions for everything in the list.
  // `direction` should be -1 or 1
  const moveGuide = useCallback(
    (
      {key: targetGuideKey, parent_reference_guide_key: targetParentKey},
      direction
    ) => {
      const guideSiblings = getGuideChildren(targetParentKey, referenceGuides);
      const targetGuideIndex = guideSiblings.findIndex(
        guide => guide.key === targetGuideKey
      );
      const swapGuideIndex = targetGuideIndex + direction;
      if (swapGuideIndex < 0 || swapGuideIndex >= guideSiblings.length) {
        // we don't need up update anything if it is at the top or bottom of the list
        return;
      }

      // the target guide is the one we clicked the move button on,
      // and the swap guide is the one in the direction we want to move
      const targetGuide = guideSiblings[targetGuideIndex];
      const swapGuide = guideSiblings[swapGuideIndex];

      // update the local list
      const swapPosition = swapGuide.position;
      swapGuide.position = targetGuide.position;
      targetGuide.position = swapPosition;
      setReferenceGuides([...referenceGuides]);

      // update the db (using the updated positions)
      const targetUpdate = fetch(`${baseUrl}/${targetGuide.key}`, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
        },
        body: JSON.stringify({
          position: targetGuide.position
        })
      });
      const swapUpdate = fetch(`${baseUrl}/${swapGuide.key}`, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
        },
        body: JSON.stringify({
          position: swapGuide.position
        })
      });
      return Promise.all([targetUpdate, swapUpdate]);
    },
    [referenceGuides, baseUrl]
  );

  return (
    <div>
      <h1>Reference Guides</h1>
      <div className="page-actions">
        <TextLink
          className="create-btn"
          icon={<FontAwesome icon="plus" />}
          iconBefore={true}
          text="Create New Guide"
        />
      </div>

      <div className="guides-table">
        <span className="header">Actions</span>
        <span className="header">Reference Guides</span>
        {organizedGuides.map(guide => {
          return [
            <div key={`${guide.key}-actions`} className="actions-box">
              <MiniIconButton
                icon="pencil-square-o"
                alt="edit"
                href={`${baseUrl}/${guide.key}/edit`}
              />
              <MiniIconButton
                icon="trash"
                alt="delete"
                func={() => deleteGuide(guide.key)}
              />
              <MiniIconButton
                icon="caret-up"
                alt="move guide up"
                func={() => moveGuide(guide, -1)}
              />
              <MiniIconButton
                icon="caret-down"
                alt="move guide down"
                func={() => moveGuide(guide, 1)}
              />
            </div>,
            <div
              key={`${guide.key}-guide`}
              className="guide-box"
              style={{paddingLeft: `${guide.level * 20 + 4}px`}}
            >
              {guide.display_name}
            </div>
          ];
        })}
      </div>
    </div>
  );
}

const referenceGuideShape = PropTypes.shape({
  key: PropTypes.string,
  parent_reference_guide_key: PropTypes.string,
  display_name: PropTypes.string,
  position: PropTypes.number
});

ReferenceGuideEditAll.propTypes = {
  referenceGuides: PropTypes.arrayOf(referenceGuideShape).isRequired,
  baseUrl: PropTypes.string.isRequired
};
