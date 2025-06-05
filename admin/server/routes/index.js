var _ = require('lodash');
var ejs = require('ejs');
var path = require('path');

var templatePath = path.resolve(__dirname, '../templates/index.html');


var enforcePermissions = function (keystone) {
	return function (req, res, next) {

    _.forEach(keystone.lists, function (list, key) {
    	//if (key!='User') delete keystone.lists[key];
        //keystone.list(key).set('hidden', true);
        //keystone.list(key).set('noedit', true);
        //keystone.list(key).set('nocreate', true);
        //keystone.list(key).set('nodelete', true);
    });

	/*
    var nav = {
        blog: ['blog', 'tag'],
        about: ['page', 'category'],
        access: 'users',
    };
    keystone.set('nav', nav);
    if (req.user) {
        // This assumes users have a set of boolean fields, "permBlog", "permAbout", etc.
        // which control access to these sets of navigation items.
        var hideLists = (name, hidden) => keystone.list(name).set('hidden', hidden);
        ['Blog', 'Tag'].map(list => hideLists(list, !req.user.permBlog));
        ['Page', 'Category'].map(list => hideLists(list, !req.user.permAbout));
        ['User'].map(list => hideLists(list, !req.user.permAdmin));
        !req.user.permBlog && delete nav.blog;
        !req.user.permAbout && delete nav.about;
        !req.user.permAccess && delete nav.access;
        keystone.nav = keystone.initNav(nav);
    }
    */

    next();
}
}




module.exports = function IndexRoute (req, res) {

	var keystone = req.keystone;
	var lists = {};
	_.forEach(keystone.lists, function (list, key) {
		lists[key] = list.getOptions();
	});

 
    keystone.pre('admin', enforcePermissions(keystone));

	var UserList = keystone.list(keystone.get('user model'));

	var orphanedLists = keystone.getOrphanedLists().map(function (list) {
		return _.pick(list, ['key', 'label', 'path']);
	});

	var backUrl = keystone.get('back url');
	if (backUrl === undefined) {
		// backUrl can be falsy, to disable the link altogether
		// but if it's undefined, default it to "/"
		backUrl = '/';
	}

	var keystoneData = {
		adminPath: '/' + keystone.get('admin path'),
		filePath: process.env.BASE_FILE_URL,
		appversion: keystone.get('appversion'),
		backUrl: backUrl,
		brand: keystone.get('brand'),
		csrf: { header: {} },
		devMode: !!process.env.KEYSTONE_DEV,
		lists: lists,
		nav: keystone.nav,
		orphanedLists: orphanedLists,
		signoutUrl: keystone.get('signout url'),
        zirfmodelname: process.env.ZIRF_MODEL || 'Zirf',
		user: {
			id: req.user.id,
			name: UserList.getDocumentName(req.user) || '(no name)',
			zirf: req.user.zirfuser
		},
		userList: UserList.key,
		version: keystone.version,
		wysiwyg: { options: {
			enableImages: keystone.get('wysiwyg images') ? true : false,
			enableCloudinaryUploads: keystone.get('wysiwyg cloudinary images') ? true : false,
			enableS3Uploads: keystone.get('wysiwyg s3 images') ? true : false,
			additionalButtons: keystone.get('wysiwyg additional buttons') || '',
			additionalPlugins: keystone.get('wysiwyg additional plugins') || '',
			additionalOptions: keystone.get('wysiwyg additional options') || {},
			overrideToolbar: keystone.get('wysiwyg override toolbar'),
			skin: keystone.get('wysiwyg skin') || 'keystone',
			menubar: keystone.get('wysiwyg menubar'),
			importcss: keystone.get('wysiwyg importcss') || '',
		} },
	};
	keystoneData.csrf.header[keystone.security.csrf.CSRF_HEADER_KEY] = keystone.security.csrf.getToken(req, res);

	var codemirrorPath = keystone.get('codemirror url path')
		? '/' + keystone.get('codemirror url path')
		: '/' + keystone.get('admin path') + '/js/lib/codemirror';

	var locals = {
		adminPath: keystoneData.adminPath,
		cloudinaryScript: false,
		codemirrorPath: codemirrorPath,
		env: keystone.get('env'),
		fieldTypes: keystone.fieldTypes,
		ga: {
			property: keystone.get('ga property'),
			domain: keystone.get('ga domain'),
		},
		keystone: keystoneData,
		title: keystone.get('name') || 'Keystone',
	};

	var cloudinaryConfig = keystone.get('cloudinary config');
	if (cloudinaryConfig) {
		var cloudinary = require('cloudinary');
		var cloudinaryUpload = cloudinary.uploader.direct_upload();
		keystoneData.cloudinary = {
			cloud_name: keystone.get('cloudinary config').cloud_name,
			api_key: keystone.get('cloudinary config').api_key,
			timestamp: cloudinaryUpload.hidden_fields.timestamp,
			signature: cloudinaryUpload.hidden_fields.signature,
		};
		locals.cloudinaryScript = cloudinary.cloudinary_js_config();
	};

	ejs.renderFile(templatePath, locals, {}, function (err, str) {
		if (err) {
			console.error('Could not render Admin UI Index Template:', err);
			return res.status(500).send(keystone.wrapHTMLError('Error Rendering Admin UI', err.message));
		}
		res.send(str);
	});
};

