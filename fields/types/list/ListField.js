/* eslint-disable react/jsx-no-bind */

import assign from 'object-assign';
import { css, StyleSheet } from 'aphrodite/no-important';
import React from 'react';
import Field from '../Field';
import Domify from 'react-domify';

import { Fields } from 'FieldTypes';
import { Button, GlyphButton } from '../../../admin/client/App/elemental';
import InvalidFieldType from '../../../admin/client/App/shared/InvalidFieldType';

let i = 0;
function generateId () {
	return i++;
};

const ItemDom = ({ name, id, index, value_length, onMoveUp, onRemove, onMoveDown, children, item_class }) => (
	<div className={item_class} style={{
		borderTop: '2px solid #ddd',
		paddingTop: 15,
	}}>
		{name && <input type="hidden" name={name} value={id}/>}
		{children}
		<div style={{ textAlign: 'right', paddingBottom: 10 }}>
            {index > 0 &&
                <GlyphButton glyph="arrow-up" position="left" onClick={onMoveUp}>
                    Up
                </GlyphButton>
            }
            {index != value_length-1 &&
                <GlyphButton glyph="arrow-down" position="left" onClick={onMoveDown}>
                    Down
                </GlyphButton>
            }
            <Button size="xsmall" color="danger" onClick={onRemove}>
				Remove
			</Button>
		</div>
	</div>
);

module.exports = Field.create({
	displayName: 'ListField',
	statics: {
		type: 'List',
	},
	propTypes: {
		fields: React.PropTypes.object.isRequired,
		label: React.PropTypes.string,
		onChange: React.PropTypes.func.isRequired,
		path: React.PropTypes.string.isRequired,
		value: React.PropTypes.array,
	},
	addItem () {
		const { path, value, onChange } = this.props;
		onChange({
			path,
			value: [
				...value,
				{
					id: generateId(),
					_isNew: true,
				},
			],
		});
	},
	removeItem (index) {
		const { value: oldValue, path, onChange } = this.props;
		const value = oldValue.slice(0, index).concat(oldValue.slice(index + 1));
		onChange({ path, value });
	},
    moveUpItem (index) {
		const { value: oldValue, path, onChange } = this.props;
		//const value = oldValue.slice(0, index).concat(oldValue.slice(index + 1));
        oldValue.splice(index-1, 0, oldValue.splice(index, 1)[0]);
        const value = oldValue;
		onChange({ path, value });
	},
    moveDownItem (index) {
		const { value: oldValue, path, onChange } = this.props;
		//const value = oldValue.slice(0, index).concat(oldValue.slice(index + 1));
        console.log(index);
        oldValue.splice(index+1, 0, oldValue.splice(index, 1)[0]);
        const value = oldValue;
        console.log(value);
		onChange({ path, value });
	},
	handleFieldChange (index, event) {
		const { value: oldValue, path, onChange } = this.props;
		const head = oldValue.slice(0, index);
		const item = {
			...oldValue[index],
			[event.path]: event.value,
		};
		const tail = oldValue.slice(index + 1);
		const value = [...head, item, ...tail];
		onChange({ path, value });
	},
	renderFieldsForItem (index, value) {
		return Object.keys(this.props.fields).map((path) => {
			const field = this.props.fields[path];
			if (typeof Fields[field.type] !== 'function') {
				return React.createElement(InvalidFieldType, { type: field.type, path: field.path, key: field.path });
			}
			const props = assign({}, field);
			props.value = value[field.path];
			props.values = value;
			props.onChange = this.handleFieldChange.bind(this, index);
			props.mode = 'edit';
			props.inputNamePrefix = `${this.props.path}[${index}]`;
			props.key = field.path;
			// TODO ?
			// if (props.dependsOn) {
            //  	props.currentDependencies = {};
            //  	Object.keys(props.dependsOn).forEach(dep => {
            //  		props.currentDependencies[dep] = this.state.values[dep];
            //  	});
            // }
			return React.createElement(Fields[field.type], props);
		}, this);
	},
	renderItems () {
		const { value = [], path } = this.props;
		const onAdd = this.addItem;
		const value_length = value.length;
		return (
			<div>
				{value.map((value, index) => {
					let { id, _isNew } = value;
					if(!id){
                        id= generateId();
                        _isNew= true;
					}
					const name = !_isNew && `${path}[${index}][id]`;
					const onRemove = e => this.removeItem(index);
					const onMoveUp = e => this.moveUpItem(index);
					const onMoveDown = e => this.moveDownItem(index);

                    const item_class = Object.keys(value)[1] == '_isNew' ?  value[Object.keys(value)[2]] : value[Object.keys(value)[1]];

					return (
						<ItemDom key={id} {...{ id, name, index, value_length, onMoveUp, onRemove, onMoveDown, item_class }}>
							{this.renderFieldsForItem(index, value)}
						</ItemDom>
					);
				})}
				<GlyphButton color="success" glyph="plus" position="left" onClick={onAdd}>
					Add
				</GlyphButton>
			</div>
		);
	},
	renderUI () {
		const { label, value } = this.props;
		return (
			<div className={css(classes.container)}>
				<h3 data-things="whatever">{label}</h3>
				{this.shouldRenderField() ? (
					this.renderItems()
				) : (
					<Domify value={value} />
				)}
				{this.renderNote()}
			</div>
		);
	},
});

const classes = StyleSheet.create({
	container: {
		margin: '2em 0',
		padding: '1.3em',
		backgroundColor: 'rgba(0, 0, 0, 0.03)',
		borderRadius: '0.3rem'
	},
});
