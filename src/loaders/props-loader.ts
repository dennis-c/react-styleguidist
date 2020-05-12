import path from 'path';
import isArray from 'lodash/isArray';
import { Handler, parse, DocumentationObject, PropDescriptor } from 'react-docgen';
import { ASTNode } from 'ast-types';
import { NodePath } from 'ast-types/lib/node-path';
import { generate } from 'escodegen';
import toAst from 'to-ast';
import createLogger from 'glogg';
import getExamples from './utils/getExamples';
import getProps from './utils/getProps';
import defaultSortProps from './utils/sortProps';
import * as consts from '../scripts/consts';
import * as Rsg from '../typings';

const logger = createLogger('rsg');

const ERROR_MISSING_DEFINITION = 'No suitable component definition found.';

export default function(this: Rsg.StyleguidistLoaderContext, source: string) {
	const file: string = this.request.split('!').pop() || '';
	const config = this._styleguidist;

	function documentationObjectPropsToSortedArray(documentationProps: {
		[propName: string]: PropDescriptor;
	}): PropDescriptor[] {
		// Transform the properties to an array. This will allow sorting
		// TODO: Extract to a module
		const propsAsArray = Object.keys(documentationProps).reduce((acc: PropDescriptor[], name) => {
			documentationProps[name].name = name;
			acc.push(documentationProps[name]);
			return acc;
		}, []);

		const sortProps = config.sortProps || defaultSortProps;
		return sortProps(propsAsArray);
	}

	// Setup Webpack context dependencies to enable hot reload when adding new files or updating any of component dependencies
	if (config.contextDependencies) {
		config.contextDependencies.forEach(dir => this.addContextDependency(dir));
	}

	const defaultParser = (
		filePath: string,
		code: string,
		resolver: (
			ast: ASTNode,
			parser: { parse: (code: string) => ASTNode }
		) => NodePath<any, any> | NodePath[],
		handlers: Handler[]
	) => parse(code, resolver, handlers, { filename: filePath });
	const propsParser = config.propsParser || defaultParser;

	let docs: DocumentationObject = {};
	let additionalComponents: DocumentationObject[] = [];
	try {
		docs = propsParser(file, source, config.resolver, config.handlers(file));

		// Support only one component
		if (isArray(docs)) {
			if (docs.length === 0) {
				throw new Error(ERROR_MISSING_DEFINITION);
			}
			additionalComponents = docs.slice(1);
			docs = docs[0];
		}
	} catch (err) {
		const errorMessage = err.toString();
		const componentPath = path.relative(process.cwd(), file);
		const message =
			errorMessage === `Error: ${ERROR_MISSING_DEFINITION}`
				? `${componentPath} matches a pattern defined in “components” or “sections” options in your ` +
				  'style guide config but doesn’t export a component.\n\n' +
				  'It usually happens when using third-party libraries, see possible solutions here:\n' +
				  `${consts.DOCS_THIRDPARTIES}`
				: `Cannot parse ${componentPath}: ${err}\n\n` +
				  'It usually means that react-docgen does not understand your source code, try to file an issue here:\n' +
				  'https://github.com/reactjs/react-docgen/issues';
		logger.warn(message);
	}

	const tempDocs = getProps(docs, file);
	let finalDocs: Rsg.PropsObject = { ...tempDocs, props: [] };

	if (tempDocs.props) {
		finalDocs.props = documentationObjectPropsToSortedArray(tempDocs.props);
	}

	// Examples from Markdown file
	const examplesFile = config.getExampleFilename(file);
	finalDocs.examples = getExamples(
		file,
		finalDocs.displayName,
		examplesFile,
		config.defaultExample
	);

	//TODO if statement based on configuration setting to allow multiple components
	finalDocs.additionalComponents = additionalComponents.map((component: DocumentationObject) => {
		const tempComponent = getProps(component, file);
		const finalComponent: Rsg.PropsObject = { ...tempComponent, props: [] };
		if (tempComponent.props) {
			finalComponent.props = documentationObjectPropsToSortedArray(tempComponent.props);
		}
		return finalComponent;
	});

	if (config.updateDocs) {
		finalDocs = config.updateDocs(finalDocs, file);
	}

	return `
if (module.hot) {
	module.hot.accept([])
}

module.exports = ${generate(toAst(finalDocs))}
	`;
}
