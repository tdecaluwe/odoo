odoo.define('web.Notification', function (require) {
'use strict';

var Widget = require('web.Widget');

/**
 * Widget which is used to display a warning/information message on the top
 * right of the screen.
 *
 * If you want to display such a notification, you probably do not want to do it
 * by importing this file. The proper way is to use the displayNotification
 * method on the Widget class.
 */
var Notification = Widget.extend({
    template: 'Notification',
    events: {
        'hidden.bs.toast': '_onClose',
        'click .o_notification_buttons button': '_onClickButton',
        'mouseenter': '_onMouseEnter',
        'mouseleave': '_onMouseLeave',
    },
    _autoCloseDelay: 4000,
    _animation: true,

    /**
     * @override
     * @param {Widget} parent
     * @param {Object} params
     * @param {string} [params.title]
     * @param {string} [params.subtitle]
     * @param {string} [params.message]
     * @param {DOMElement|jQuery} [params.contentEl] element to insert inside the
     *      notification, useful to keep a reference to the notification content
     * @param {string} [params.type='warning'] 'info', 'success', 'warning', 'danger' or ''
     * @param {boolean} [params.sticky=false] if true, the notification will
     *      stay visible until the user clicks on it.
     * @param {string} [params.className]
     * @param {function} [params.onClose] callback when the user click on the x
     *      or when the notification is auto close (no sticky)
     * @param {Object[]} params.buttons
     * @param {function} params.buttons[0].click callback on click
     * @param {boolean} [params.buttons[0].primary] display the button as primary
     * @param {string} [params.buttons[0].text] button label
     * @param {string} [params.buttons[0].icon] font-awsome className or image src
     * @param {boolean} [params.messageIsHtml=false] allows passing an html
     *  message. Strongly discouraged: other options should be considered before
     *  enabling this option. The responsibility is on the caller to properly
     *  escape the message if this option is enabled.
     */
    init: function (parent, params) {
        this._super.apply(this, arguments);
        this.title = params.title;
        this.subtitle = params.subtitle;
        this.contentEl = params.contentEl;
        this.message = params.message || this.contentEl && true;
        this.buttons = params.buttons || [];
        this.messageIsHtml = !!params.messageIsHtml;
        this.sticky = !!this.buttons.length || !!params.sticky;
        this.type = params.type === undefined ? 'warning' : params.type;
        this.className = params.className || '';
        this._closeCallback = params.onClose;

        if (this.type === 'danger') {
            this.className += ' bg-danger';
        } else if (this.type === 'warning') {
            this.className += ' bg-warning';
        } else if (this.type === 'success') {
            this.className += ' bg-success';
        } else if (this.type === 'info') {
            this.className += ' bg-info';
        }
    },
    /**
     * @override
     */
    start: function () {
        if (this.contentEl) {
            this.$('.o_notification_content').empty().append(this.contentEl);
        }
        this.$el.toast({
            animation: this._animation,
            autohide: false,
        });
        void this.$el[0].offsetWidth; // Force a paint refresh before showing the toast
        if (!this.sticky) {
            this.autohide = _.cancellableThrottleRemoveMeSoon(this.close, this._autoCloseDelay, {leading: false});
            this.$el.on('shown.bs.toast', () => {
                this.autohide();
            });
        }
        this.$el.toast('show');
        return this._super.apply(this, arguments);
    },
    /**
     * @override
     */
    destroy: function () {
        this.$el.toast('dispose');
        this._super.apply(this, arguments);
    },

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Destroys the widget with a nice animation.
     *
     * @private
     * @param {boolean} [silent=false] if true, the notification does not call
     *   _closeCallback method
     */
    close: function (silent) {
        this.silent = silent;
        this.$el.toast('hide');

        // Make 'close' work if the notification is not shown yet but will be.
        // Should not be needed but the calendar notification system is an
        // example of feature that does not work without this yet.
        var self = this;
        this.$el.one('shown.bs.toast', function () {
            self.$el.toast('hide');
        });
    },

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * @private
     * @param {MouseEvent} ev
     */
    _onClickButton: function (ev) {
        ev.preventDefault();
        if (this._buttonClicked) {
            return;
        }
        this._buttonClicked = true;
        var index = $(ev.currentTarget).index();
        var button = this.buttons[index];
        if (button.click) {
            button.click();
        }
        this.close(true);
    },
    /**
     * @private
     * @param {Event} ev
     */
    _onClose: function (ev) {
        this.trigger_up('close');
        if (!this.silent && !this._buttonClicked) {
            if (this._closeCallback) {
                this._closeCallback();
            }
        }
        this.destroy();
    },
    /**
     * @private
     */
    _onMouseEnter: function () {
        if (!this.sticky) {
            this.autohide.cancel();
        }
    },
    /**
     * @private
     */
    _onMouseLeave: function () {
        if (!this.sticky) {
            this.autohide();
        }
    },
});

return Notification;
});
