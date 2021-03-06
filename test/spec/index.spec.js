
const promised = require('chai-as-promised');
const expect   = require('chai').use(promised).expect;
const logs     = require('../../index');
const mocks    = require('./mocks');


describe('Browser Logs', () => {

  var browserConsole,
      browserLogs;

  beforeEach(function () {
    var store = [];
    browserConsole = mocks.console(store);
    browserLogs = logs(mocks.browser(store, 'chrome'));
  });

  it('should not fail if console is empty', () => {
    return expect(browserLogs.verify()).to.eventually.be.fulfilled;
  });

  it('should fail if there is at least a single message', () => {
    browserConsole.error('Oops!');
    return expect(browserLogs.verify()).to.eventually.be.rejectedWith(
      'UNEXPECTED MESSAGE: {"level":"SEVERE","message":"Oops!"}');
  });

  it('should fail on first message, even if there are more messages', () => {
    browserConsole.error('Oops!');
    browserConsole.warn('Oops!');
    return expect(browserLogs.verify()).to.eventually.be.rejectedWith(
      'UNEXPECTED MESSAGE: {"level":"SEVERE","message":"Oops!"}');
  });

  it('should allow ignoring the messages', () => {
    browserConsole.error('Oops!');
    browserLogs.ignore(() => { return true; });
    return expect(browserLogs.verify()).to.eventually.be.fulfilled;
  });

  it('should allow ignoring the specific messages only', () => {
    browserConsole.error('Oops!');
    browserConsole.warn('Oops!');
    browserLogs.ignore((message) => { return message.level.name === 'SEVERE'; });
    return expect(browserLogs.verify()).to.eventually.be.rejectedWith(
      'UNEXPECTED MESSAGE: {"level":"WARNING","message":"Oops!"}');
  });

  it('should have predefined ignore functions', () => {
    browserConsole.error('Oops!');
    browserConsole.warn('Oops!');
    browserConsole.info('Oops!');
    browserConsole.debug('Oops!');
    browserConsole.log('Oops!');
    browserLogs.ignore(browserLogs.ERROR);
    browserLogs.ignore(browserLogs.WARNING);
    browserLogs.ignore(browserLogs.INFO);
    browserLogs.ignore(browserLogs.DEBUG);
    browserLogs.ignore(browserLogs.LOG);
    return expect(browserLogs.verify()).to.eventually.be.fulfilled;
  });

  it('should allow using "or" helper function', () => {
    browserConsole.error('Oops!');
    browserConsole.warn('Oops!');
    browserLogs.ignore(browserLogs.or(browserLogs.ERROR, browserLogs.WARNING));
    return expect(browserLogs.verify()).to.eventually.be.fulfilled;
  });

  it('should allow using "and" helper function', () => {
    function havingLetter(letter) {
      return function (message) {
        return message.message.indexOf(letter) !== -1;
      };
    }
    browserConsole.error('Oops!');
    browserLogs.ignore(browserLogs.and(havingLetter('O'), havingLetter('!')));
    return expect(browserLogs.verify()).to.eventually.be.fulfilled;
  });

  it('should allow ignoring the strings', () => {
    browserConsole.error('This is a very long error');
    browserLogs.ignore('very long');
    return expect(browserLogs.verify()).to.eventually.be.fulfilled;
  });

  it('should allow ignoring the strings only using the case sensitivity', () => {
    browserConsole.error('This is a very long error');
    browserLogs.ignore('VERY LONG');
    return expect(browserLogs.verify()).to.eventually.be.rejectedWith(
      'UNEXPECTED MESSAGE: {"level":"SEVERE","message":"This is a very long error"}');
  });

  it('should allow ignoring regular expressions', () => {
    browserConsole.error('Oops!');
    browserLogs.ignore(/oops/ig);
    return expect(browserLogs.verify()).to.eventually.be.fulfilled;
  });

  it('should allow setting expectations', () => {
    browserLogs.expect('Oops!');
    return expect(browserLogs.verify()).to.eventually.be.rejectedWith('NO MESSAGE TO EXPECT');
  });

  it('should allow expecting a sequence', () => {
    browserLogs.expect('a');
    browserLogs.expect('b');
    browserConsole.log('a');
    browserConsole.log('b');
    return expect(browserLogs.verify()).to.eventually.be.fulfilled;
  });

  it('should fail if expectation sequence doesnt match', () => {
    browserLogs.expect('b');
    browserLogs.expect('a');
    browserConsole.log('a');
    browserConsole.log('b');
    return expect(browserLogs.verify()).to.eventually.be.rejectedWith(
      'UNEXPECTED MESSAGE: {"level":"INFO","message":"a"}');
  });

  it('should allow reseting the ignores and expections', () => {
    browserLogs.expect('a');
    browserLogs.expect('b');
    browserLogs.reset();
    return expect(browserLogs.verify()).to.eventually.be.fulfilled;
  });

  it('should work only with chrome browser', () => {
    var firefox = logs(mocks.browser([], 'firefox'));
    firefox.expect('Oops!');
    return expect(firefox.verify()).to.eventually.be.fulfilled;
  });

  it('should fail if expectation is being ignored', () => {
    browserLogs.expect('a');
    browserLogs.ignore('a');
    browserConsole.error('a');
    expect(browserLogs.verify()).to.eventually.be.rejectedWith('NO MESSAGE TO EXPECT');
  });

  it('should not fail calling verify multiple times', function() {
    browserLogs.expect('a');
    browserConsole.error('a');
    browserLogs.verify().then(function () {
      return browserLogs.verify();
    });
  });

});
