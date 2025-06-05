import Field from '../Field';
import React from 'react';
import {Button, Modal, FormInput } from '../../../admin/client/App/elemental';

import xhr from 'xhr';
import Select from "react-select";


/**
 * TODO:
 * - Remove dependency on jQuery
 */

// Scope jQuery and the bootstrap-markdown editor so it will mount
var $ = require('jquery');
require('./lib/bootstrap-markdown');



var insertDocument = function (e, component) {
	console.log('insert document',e,'keystone',Keystone);
	/*
    xhr({
        url: '/api/file/',
        responseType: 'json',
    }, (err, resp, data) => {
        console.log('data from file',resp, data);
        component.toggleModal(data);

    });
	*/
    component.toggleModal();
}


var insertlink = function(e,link){
        // Give [] surround the selection and prepend the link
        var chunk, cursor, selected = e.getSelection(), content = e.getContent(), link


            chunk = link.name;
  			var item =link.fileUrl || link.fields.fileUrl;

            var sanitizedLink = encodeURI($('<div>'+item+'</div>').text());

            if (Keystone.filePath) {
            	var url = new URL(sanitizedLink);
            	url.hostname = Keystone.filePath.replace('https://', '');
            	sanitizedLink = url.href;
            }

            // we add "!" for target _blank attribute.
            if (link.target) {
				sanitizedLink = '!' + sanitizedLink;            	
            }

            // transform selection and set the cursor into chunked text
            e.replaceSelection('['+chunk+']('+sanitizedLink+')')
            cursor = selected.start+1

            // Set the cursor
            e.setSelection(cursor,cursor+chunk.length)
}


// Append/remove ### surround the selection
// Source: https://github.com/toopay/bootstrap-markdown/blob/master/js/bootstrap-markdown.js#L909
var toggleHeading = function (e, level) {
	var chunk;
	var cursor;
	var selected = e.getSelection();
	var content = e.getContent();
	var pointer;
	var prevChar;

	if (selected.length === 0) {
		// Give extra word
		chunk = e.__localize('text');
	} else {
		chunk = selected.text + '\n';
	}

	// transform selection and set the cursor into chunked text
	if ((pointer = level.length + 1, content.substr(selected.start - pointer, pointer) === level + ' ')
		|| (pointer = level.length, content.substr(selected.start - pointer, pointer) === level)) {
		e.setSelection(selected.start - pointer, selected.end);
		e.replaceSelection(chunk);
		cursor = selected.start - pointer;
	} else if (selected.start > 0 && (prevChar = content.substr(selected.start - 1, 1), !!prevChar && prevChar !== '\n')) {
		e.replaceSelection('\n\n' + level + ' ' + chunk);
		cursor = selected.start + level.length + 3;
	} else {
		// Empty string before element
		e.replaceSelection(level + ' ' + chunk);
		cursor = selected.start + level.length + 1;
	}

	// Set the cursor
	e.setSelection(cursor, cursor + chunk.length);
};

var renderMarkdown = function (component) {
	// dependsOn means that sometimes the component is mounted as a null, so account for that & noop
	if (!component.refs.markdownTextarea) {
		return;
	}
	
    if ($(component.refs.markdownTextarea).data('markdown') && component && component.state &&  component.state.selecteditem){
    	var e = $(component.refs.markdownTextarea).data('markdown');
    	component.state.selecteditem.target = component.state.attrvalue;
        insertlink(e, component.state.selecteditem);
        component.setState({
        	selecteditem: null,
        	attrvalue: false
        });

	}

	var options = {
		autofocus: false,
		savable: false,
		resize: 'vertical',
		height: component.props.height,
		hiddenButtons: ['Heading'],
        onChange: function(e){
            console.log("Changed!")
        },
		// Heading buttons
		additionalButtons: [{
			name: 'groupHeaders',
			data: [{
				name: 'cmdH1',
				title: 'Heading 1',
				btnText: 'H1',
				callback: function (e) {
					toggleHeading(e, '#');
				},
			}, {
				name: 'cmdH2',
				title: 'Heading 2',
				btnText: 'H2',
				callback: function (e) {
					toggleHeading(e, '##');
				},
			}, {
				name: 'cmdH3',
				title: 'Heading 3',
				btnText: 'H3',
				callback: function (e) {
					toggleHeading(e, '###');
				},
			}, {
				name: 'cmdH4',
				title: 'Heading 4',
				btnText: 'H4',
				callback: function (e) {
					toggleHeading(e, '####');
				},
			}
            ,{
                name: 'cmdinsertDocument',
                title: 'insert Document',
                btnText: 'Insert Document',
                callback: function (e) {
                    insertDocument(e,component);
                },
            }, {
				name: 'cite',
				title: 'Blockquote',
				btnText: '“ ”',
				callback: function (e) {
					toggleHeading(e, '>');
				},
			}],
		}],

		// Insert Header buttons into the toolbar
		reorderButtonGroups: ['groupFont', 'groupHeaders', 'groupLink', 'groupMisc', 'groupUtil'],
	};

	if (component.props.toolbarOptions.hiddenButtons) {
		var hiddenButtons = (typeof component.props.toolbarOptions.hiddenButtons === 'string')
			? component.props.toolbarOptions.hiddenButtons.split(',')
			: component.props.toolbarOptions.hiddenButtons;

		options.hiddenButtons = options.hiddenButtons.concat(hiddenButtons);
	}

	$(component.refs.markdownTextarea).markdown(options);
};



module.exports = Field.create({
	displayName: 'MarkdownField',
	statics: {
		type: 'Markdown',
		getDefaultValue: () => ({}),
	},



    getInitialState: function getInitialState() {
        return {
            modalIsOpen: false,
			modaldata: [],
			selecteditem:null,
			attrvalue: false
        }
    },

    toggleModalOk (selecteditem) {
		this.toggleModal(null,this.selecteditem);
	},



    toggleModal: function toggleModal(data,selecteditem) {
		var next = !this.state.modalIsOpen;
		var newstate =  {
            modalIsOpen: next
        };
		if(data) newstate.modaldata = data;
        if(selecteditem){
            this.selecteditem = null;
            newstate.selecteditem = selecteditem;
		}
        this.setState(newstate);
    },

                            // override `shouldCollapse` to check the markdown field correctly
	shouldCollapse () {
		return this.props.collapse && !this.props.value.md;
	},

	// only have access to `refs` once component is mounted
	componentDidMount () {
		if (this.props.wysiwyg) {
			renderMarkdown(this);
		}
	},

	// only have access to `refs` once component is mounted
	componentDidUpdate  () {
		if (this.props.wysiwyg) {
			renderMarkdown(this);
		}
	},



    loadOptions (input, callback) { 
        // NOTE: this seems like the wrong way to add options to the Select
        this.loadOptionsCallback = callback;
        const filters = '';
        xhr({
            url: Keystone.adminPath + '/api/files' + '?basic&search=' + input + '&' + filters,
            responseType: 'json',
        }, (err, resp, data) => {
            if (err) {
                console.error('Error loading items:', err);
                return callback(null, []);
            }
			this.cachedresults = data.results;
            callback(null, {
                options: data.results,
                complete: data.results.length === data.count,
            });
        });
    },

    valueChanged (value) {
        let founditem = null;
        if(this.cachedresults && this.cachedresults.length){
        	founditem = this.cachedresults.find((el)=>el.id==value);
		}
        this.selecteditem = founditem;
        this.setState({
            filevalue: value,
        });
    },

    tabChanged (value) {
        this.setState({
            attrvalue: !this.state.attrvalue,
        });
    },

	renderModaldata(){
          if(this.state.modaldata){
          	 // this.selecteditem = this.state.modaldata[0];
              console.log(this.state.modaldata[0]);
          }
          return(

              <div>
                  {/* This input element fools Safari's autocorrect in certain situations that completely break react-select */}
                  <input type="text" style={{ position: 'absolute', width: 1, height: 1, zIndex: -1, opacity: 0 }} tabIndex="-1"/>
				  <Select.Async
                      loadOptions={this.loadOptions}
                      labelKey="name"
                      name="file"
                      onChange={this.valueChanged}
                      simpleValue
                      value={this.state.filevalue}
                      valueKey="id"
                  />
                  <input type="checkbox" name="tab" style={{marginTop: '10px'}} value="0" onChange={this.tabChanged.bind(this)} /> Open in new tab
              </div>


		  );
    },

    renderModal () {
		return (
			<Modal.Dialog isOpen={this.state.modalIsOpen} onCancel={this.toggleModal} backdropClosesModal>
				<Modal.Header text="Please select file to insert as a link" showCloseButton onClose={this.toggleModal} />
				<Modal.Body>{this.renderModaldata()}</Modal.Body>
				<Modal.Footer>
					<Button type="primary" onClick={this.toggleModalOk}>Ok</Button>
					<Button type="link-cancel" onClick={this.toggleModal}>Cancel</Button>
				</Modal.Footer>
			</Modal.Dialog>
		);
	},


	renderField () {
		const styles = {
			padding: 8,
			height: this.props.height,
		};
		const defaultValue = (
			this.props.value !== undefined
			&& this.props.value.md !== undefined
		)
		? this.props.value.md
		: '';

		return (
			<div>
			{this.renderModal()}
			<textarea
				className="md-editor__input code"
				defaultValue={defaultValue}
				name={this.getInputName(this.props.paths.md)}
				ref="markdownTextarea"
				style={styles}
			/>
				</div>
		);
	},

	renderValue () {
		// TODO: victoriafrench - is this the correct way to do this? the object
		// should be creating a default md where one does not exist imo.

		const innerHtml = (
			this.props.value !== undefined
			&& this.props.value.md !== undefined
		)
		? this.props.value.md.replace(/\n/g, '<br />')
		: '';

		return (
			<FormInput
				dangerouslySetInnerHTML={{ __html: innerHtml }}
				multiline
				noedit
			/>
		);
	},
});



