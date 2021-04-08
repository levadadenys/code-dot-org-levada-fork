import {assert} from '../../util/deprecatedChai';
import React from 'react';
import {shallow} from 'enzyme';
import sinon from 'sinon';
import {JavalabSettings} from '@cdo/apps/javalab/JavalabSettings';

const clickSpy = sinon.spy();

const defaultProps = {
  style: {},
  children: [
    <a onClick={clickSpy}>onclick</a>,
    <a onClick={clickSpy}>onclick2</a>
  ]
};

describe('JavalabSettings', () => {
  beforeEach(() => clickSpy.resetHistory());

  it('is initially just a button', () => {
    const wrapper = shallow(<JavalabSettings {...defaultProps} />);
    assert.strictEqual(wrapper.children().length, 1);
    assert.strictEqual(wrapper.childAt(0).name(), 'button');
  });

  it('shows children when clicked', () => {
    const wrapper = shallow(<JavalabSettings {...defaultProps} />);
    wrapper.find('button').simulate('click');
    assert.strictEqual(wrapper.find('a').length, 2);
  });

  it('passes through onClick and closes dropdown', () => {
    const wrapper = shallow(<JavalabSettings {...defaultProps} />);
    wrapper.find('button').simulate('click');
    assert(
      wrapper
        .find('a')
        .at(1)
        .props().onClick
    );
    wrapper
      .find('a')
      .at(1)
      .simulate('click');
    assert(clickSpy.calledOnce);

    // dropdown is closed
    assert.equal(wrapper.find('a').length, 0);
  });
});
