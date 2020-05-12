import React, { Component } from 'react';
import PropTypes from 'prop-types';

/* eslint-disable react/no-multi-comp */

/**
 * ButtonOne, to see if multiple exports work
 */
export class MultipleButtonOne extends Component {
	static propTypes = {
		/**
		 * A property on ButtonOne
		 */
		OneProp: PropTypes.bool,
	};

	render() {
		return <button className="multiple-button-one">MultipleButtonOne</button>;
	}
}

/**
 * ButtonTwo, to see if multiple exports work
 */
export class MultipleButtonTwo extends Component {
	static propTypes = {
		/**
		 * A property on ButtonTwo
		 */
		TwoProp: PropTypes.bool,
	};

	render() {
		return <button className="multiple-button-one">MultipleButtonTwo</button>;
	}
}
