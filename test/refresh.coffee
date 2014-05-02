refresh = require('../lib/refresh')
mockServer = require('./mockServer')

describe 'refresh', ->
  simulatePageNotBeingFound = ->
    sinon.stub(jQuery, "ajax").yieldsTo('success', {title: 'asdf'})

  $page = undefined

  before ->
    $page = $('<div id="refresh" />')
    $page.appendTo('body')
  after ->
    $page.empty()

  it "creates a ghost page when page couldn't be found", ->
    mockServer.simulatePageNotFound()
    $page.each refresh.cycle
    expect( $page.hasClass('ghost') ).to.be(true)
    expect( $page.data('data').story[0].type ).to.be('future')

  xit 'should refresh a page', (done) ->
    simulatePageFound({title: 'asdf'})
    $page.each refresh.cycle
    jQuery.ajax.restore()

    expect($('#refresh h1').text()).to.be(' asdf')
    done()
