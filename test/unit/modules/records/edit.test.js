import { Artifact as Record } from '../../../../src/modules/records/artifact'
import { EditRecord } from '../../../../src/modules/records/edit'

describe('RFC6902 Tests', () => {
  test('create RFC6902 Patch', () => {
    let edit = new EditRecord()

    let rfc6902Patch = edit.createRFC6902Patch({ field: 'before' }, { field: 'after' })

    expect(rfc6902Patch).toEqual([ { op: 'replace', path: '/field', value: 'after' } ])
  })
})

describe('Squash RFC6902', () => {
  test('squash RFC6902 Patch (single field, single op)', () => {
    let edit = new EditRecord()

    let rfc6902Patch = [ { op: 'replace', path: '/field', value: 'after' } ]

    let squashedPatch = edit.squashRFC6902Patch(rfc6902Patch)

    expect(squashedPatch).toEqual({ replace: { '/field': 'after' } })
  })
  test('squash RFC6902 Patch (multiple fields, single op)', () => {
    let edit = new EditRecord()

    let rfc6902Patch = [
      { op: 'replace', path: '/field', value: 'after' },
      { op: 'replace', path: '/second', value: 'two' }
    ]

    let squashedPatch = edit.squashRFC6902Patch(rfc6902Patch)

    expect(squashedPatch).toEqual({ replace: { '/field': 'after', '/second': 'two' } })
  })
  test('squash RFC6902 Patch (single field, multiple ops)', () => {
    let edit = new EditRecord()

    let rfc6902Patch = [
      { op: 'remove', path: '/field' },
      { op: 'replace', path: '/second', value: 'two' }
    ]

    let squashedPatch = edit.squashRFC6902Patch(rfc6902Patch)

    expect(squashedPatch).toEqual({
      remove: [ '/field' ],
      replace: { '/second': 'two' }
    })
  })
  test('squash RFC6902 Patch (multiple fields, multiple ops)', () => {
    let edit = new EditRecord()

    let rfc6902Patch = [
      { op: 'remove', path: '/first' },
      { op: 'remove', path: '/second' },
      { op: 'replace', path: '/third', value: 'three' },
      { op: 'replace', path: '/fourth', value: 'four' },
      { op: 'replace', path: '/fifth', value: 'five' },
      { op: 'add', path: '/sixth', value: 'six' },
      { op: 'add', path: '/seventh', value: 'seven' },
      { op: 'move', from: '/eigth', path: '/newEightLand' },
      { op: 'copy', from: '/ninth', path: '/nineTopia' },
      { op: 'test', path: '/myField', value: 'eightyNine' }
    ]

    let squashedPatch = edit.squashRFC6902Patch(rfc6902Patch)

    expect(squashedPatch).toEqual({
      remove: [ '/first', '/second' ],
      replace: {
        '/third': 'three',
        '/fourth': 'four',
        '/fifth': 'five'
      },
      add: {
        '/sixth': 'six',
        '/seventh': 'seven'
      },
      move: {
        '/eigth': '/newEightLand'
      },
      copy: {
        '/ninth': '/nineTopia'
      },
      test: {
        '/myField': 'eightyNine'
      }
    })
  })
})
describe('Unsquash RFC6902', () => {
  test('Unsquash RFC6902 Patch (single field, single op)', () => {
    let edit = new EditRecord()

    let squashedPatch = { remove: [ '/first' ] }

    let rfc6902Patch = edit.unsquashRFC6902Patch(squashedPatch)

    expect(rfc6902Patch).toEqual([
      { op: 'remove', path: '/first' }
    ])
  })

  test('Unsquash RFC6902 Patch (multiple fields, single op)', () => {
    let edit = new EditRecord()

    let squashedPatch = { remove: [ '/first', '/second' ] }

    let rfc6902Patch = edit.unsquashRFC6902Patch(squashedPatch)

    expect(rfc6902Patch).toEqual([
      { op: 'remove', path: '/first' },
      { op: 'remove', path: '/second' }
    ])
  })

  test('Unsquash RFC6902 Patch (single field, multiple ops)', () => {
    let edit = new EditRecord()

    let squashedPatch = {
      remove: [ '/first' ],
      replace: { '/second': 'two' }
    }

    let rfc6902Patch = edit.unsquashRFC6902Patch(squashedPatch)

    expect(rfc6902Patch).toEqual([
      { op: 'remove', path: '/first' },
      { op: 'replace', path: '/second', value: 'two' }
    ])
  })

  test('Unsquash RFC6902 Patch (multiple fields, multiple ops)', () => {
    let edit = new EditRecord()

    let squashedPatch = {
      remove: [ '/first', '/second' ],
      replace: {
        '/third': 'three',
        '/fourth': 'four',
        '/fifth': 'five'
      },
      add: {
        '/sixth': 'six',
        '/seventh': 'seven'
      },
      move: {
        '/eigth': '/newEightLand'
      },
      copy: {
        '/ninth': '/nineTopia'
      },
      test: {
        '/myField': 'eightyNine'
      }
    }

    let rfc6902Patch = edit.unsquashRFC6902Patch(squashedPatch)

    expect(rfc6902Patch).toEqual([
      { op: 'remove', path: '/first' },
      { op: 'remove', path: '/second' },
      { op: 'replace', path: '/third', value: 'three' },
      { op: 'replace', path: '/fourth', value: 'four' },
      { op: 'replace', path: '/fifth', value: 'five' },
      { op: 'add', path: '/sixth', value: 'six' },
      { op: 'add', path: '/seventh', value: 'seven' },
      { op: 'move', from: '/eigth', path: '/newEightLand' },
      { op: 'copy', from: '/ninth', path: '/nineTopia' },
      { op: 'test', path: '/myField', value: 'eightyNine' }
    ])
  })
})

describe('Apply Squashed Patch to Record', () => {
  test('apply Squashed Patch', () => {
    let originalRecord = new Record()

    originalRecord.setTXID('wrongTXID')
    originalRecord.setOriginalTXID('testTXID')
    originalRecord.setTitle('original title')
    originalRecord.setType('Text')

    originalRecord.meta.type = 'oip042'

    let squashedPatch = { replace: { '/info/title': 'my new thing' } }

    let edit = new EditRecord(undefined, originalRecord)

    // setPatch should apply the patch to the Original Record if there is no "patched record" defined
    edit.setPatch(squashedPatch)

    let modifedRecord = edit.getPatchedRecord()

    expect(modifedRecord.getTitle()).toBe('my new thing')
  })
})

describe('Create Squashed Patch from Records', () => {
  test('Create Patch (simple Record)', () => {
    let originalRecord = new Record()

    originalRecord.meta.type = 'oip042'
    originalRecord.setTXID('wrongTXID')
    originalRecord.setOriginalTXID('testTXID')
    originalRecord.setTitle('original title')
    originalRecord.setSignature('originalSig')
    originalRecord.setTimestamp(1234)

    let modifiedRecord = new Record()
    modifiedRecord.fromJSON(originalRecord.toJSON())

    modifiedRecord.setTitle('my new thing')
    modifiedRecord.setSignature('updatedSig')
    modifiedRecord.setTimestamp(2345)

    let edit = new EditRecord(undefined, originalRecord, modifiedRecord)

    expect(edit.getPatch()).toEqual({
      replace: {
        '/info/title': 'my new thing',
        '/signature': 'updatedSig',
        '/timestamp': 2345
      }
    })
  })
  test('Create Patch (reject valid if empty patch)', () => {
    let originalRecord = new Record()

    originalRecord.meta.type = 'oip042'
    originalRecord.setTXID('wrongTXID')
    originalRecord.setOriginalTXID('testTXID')
    originalRecord.setTitle('original title')
    originalRecord.setTimestamp(1234)
    originalRecord.setSignature('mySig')

    let modifiedRecord = new Record()
    modifiedRecord.fromJSON(originalRecord.toJSON())
    modifiedRecord.setTimestamp(2345)
    modifiedRecord.setSignature('updatedSig')

    let edit = new EditRecord(undefined, originalRecord, modifiedRecord)
    edit.setTimestamp(Date.now())
    edit.setSignature('editSig')

    expect(edit.edit.txid).toBe('testTXID')
    expect(edit.getPatch()).toEqual({
      replace: {
        '/signature': 'updatedSig',
        '/timestamp': 2345
      }
    })
    expect(edit.isValid()).toEqual({ success: false, error: 'Empty Patch! You must modify the Record in order to edit it!' })
  })
})

describe('Serialization', () => {
  test('Create EditRecord from JSON', () => {
    let edit = new EditRecord({
      edit: {
        txid: 'abcd',
        timestamp: 1234
      }
    })

    expect(edit.getTimestamp()).toBe(1234)
  })
  test('Turn EditRecord into JSON', () => {
    let edit = new EditRecord()

    edit.setTimestamp(1234)

    let jsonEdit = edit.toJSON()

    expect(jsonEdit.edit.timestamp).toBe(1234)
  })
  test('Serialize EditRecord for Blockchain', () => {
    let edit = new EditRecord({
      edit: {
        txid: 'abcd',
        timestamp: 1234,
        patch: 'test1234'
      },
      signature: 'mySig'
    })

    expect(edit.serialize()).toEqual(`json:${JSON.stringify({
      oip042: {
        edit: {
          artifact: {
            txid: 'abcd',
            timestamp: 1234,
            patch: 'test1234'
          },
          signature: 'mySig'
        }
      }
    })}`)
  })
})

describe('Signature', () => {
  test('Signature Preimage', () => {
    let edit = new EditRecord({
      edit: {
        txid: 'abcd',
        timestamp: 1234,
        patch: 'test1234'
      }
    })

    expect(edit.createPreimage()).toEqual('abcd-1234')
  })
  test('Should be able to Sign', async () => {
    let edit = new EditRecord({
      edit: {
        txid: 'abcd',
        timestamp: 1234,
        patch: 'test1234'
      }
    })

    await edit.signSelf(async (preimage) => {
      expect(preimage).toBe('abcd-1234')

      return 'mySig-' + preimage
    })

    expect(edit.getSignature()).toBe('mySig-abcd-1234')
  })
})
