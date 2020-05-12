import React from 'react';
import PropTypes from 'prop-types';
import { MethodDescriptor } from 'react-docgen';
import { PropDescriptor } from 'rsg-components/Props/util';
import Props from 'rsg-components/Props';
import Methods from 'rsg-components/Methods';
import isEmpty from 'lodash/isEmpty';
import * as Rsg from '../../../typings';

const Usage: React.FunctionComponent<{
	props: {
		methods?: MethodDescriptor[];
		props?: PropDescriptor[];
		additionalComponents?: Rsg.PropsObject[];
	};
}> = ({ props: { props, methods, additionalComponents } }) => {
	const propsNode = props && !isEmpty(props) && <Props props={props} />;
	const methodsNode = methods && !isEmpty(methods) && <Methods methods={methods} />;
	const additionalComponentsNode =
		additionalComponents &&
		additionalComponents.map((component: Rsg.PropsObject) => {
			return (
				<div key={component.displayName}>
					<h2>{component.displayName}</h2>
					<Props props={component.props as PropDescriptor[]} />
				</div>
			);
		});

	if (!propsNode && !methodsNode) {
		return null;
	}

	return (
		<div>
			{propsNode}
			{methodsNode}
			{additionalComponentsNode}
		</div>
	);
};

Usage.propTypes = {
	props: PropTypes.shape({
		props: PropTypes.array,
		methods: PropTypes.array,
		additionalComponents: PropTypes.array,
	}).isRequired,
};

export default Usage;
