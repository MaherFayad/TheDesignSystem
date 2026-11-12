import { describe, expect, it } from 'vitest';
import { collectErrors, firstInvalid, hasErrors, mapServerErrors, orderErrors, type FormValidator } from './form';

const required: FormValidator = (v) => (typeof v === 'string' && v.trim() !== '' ? undefined : 'Add a value.');

describe('collectErrors', () => {
  it('runs validators and keeps the first failing message per field', () => {
    const short: FormValidator = (v) => (typeof v === 'string' && v.length < 3 ? 'Use 3 characters or more.' : null);
    const errors = collectErrors({ name: '', code: 'ab', ok: 'fine' }, { name: [required, short], code: [required, short], ok: required });
    expect(errors).toEqual({ name: 'Add a value.', code: 'Use 3 characters or more.' });
  });

  it('passes every value to a validator, for checks across fields', () => {
    const match: FormValidator<{ password: string; repeat: string }> = (v, all) => (v === all.password ? undefined : 'Type the same password twice.');
    expect(collectErrors({ password: 'a', repeat: 'b' }, { repeat: match })).toEqual({ repeat: 'Type the same password twice.' });
  });

  it('keeps a base message and skips the validators of that name', () => {
    let ran = false;
    const spy: FormValidator = () => {
      ran = true;
      return 'Custom';
    };
    expect(collectErrors({ email: 'x' }, { email: spy }, { email: 'Add the part after the @.' })).toEqual({ email: 'Add the part after the @.' });
    expect(ran).toBe(false);
  });

  it('ignores empty messages and false', () => {
    expect(collectErrors({ a: '' }, { a: () => false }, { b: '' })).toEqual({});
  });
});

describe('firstInvalid and orderErrors', () => {
  it('follows the form order, then the order of the errors', () => {
    const errors = { city: 'Add a city.', email: 'Add an email.', extra: 'Server note.' };
    expect(firstInvalid(['name', 'email', 'city'], errors)).toBe('email');
    expect(firstInvalid([], errors)).toBe('city');
    expect(firstInvalid(['name'], {})).toBeUndefined();
    expect(orderErrors(['name', 'email', 'city'], errors).map((e) => e.name)).toEqual(['email', 'city', 'extra']);
  });

  it('hasErrors', () => {
    expect(hasErrors({})).toBe(false);
    expect(hasErrors({ a: ' ' })).toBe(false);
    expect(hasErrors({ a: 'x' })).toBe(true);
    expect(hasErrors(null)).toBe(false);
  });
});

describe('mapServerErrors', () => {
  it('reads a record of messages or lists', () => {
    expect(mapServerErrors({ email: ['This email is already in use.', 'Second'], name: 'Too long.' })).toEqual({
      fields: { email: 'This email is already in use.', name: 'Too long.' },
      form: [],
    });
  });

  it('reads a list of entries with field, name or path, and an errors wrapper', () => {
    const out = mapServerErrors({
      errors: [
        { field: 'email', message: 'Taken.' },
        { name: 'phone', message: 'Use a Saudi number.' },
        { path: ['address', 'city'], message: 'Pick a city we deliver to.' },
        { message: 'The server is busy. Send the form again in a minute.' },
      ],
    });
    expect(out.fields).toEqual({ email: 'Taken.', phone: 'Use a Saudi number.', 'address.city': 'Pick a city we deliver to.' });
    expect(out.form).toEqual(['The server is busy. Send the form again in a minute.']);
  });

  it('sends unknown names and form keys to form, and renames', () => {
    const out = mapServerErrors(
      { 'user.email': 'Taken.', token: 'Expired.', non_field_errors: ['Try again.'] },
      { names: ['email'], rename: { 'user.email': 'email' } },
    );
    expect(out).toEqual({ fields: { email: 'Taken.' }, form: ['Expired.', 'Try again.'] });
  });

  it('reads a plain string and ignores junk', () => {
    expect(mapServerErrors('Network error.')).toEqual({ fields: {}, form: ['Network error.'] });
    expect(mapServerErrors(null)).toEqual({ fields: {}, form: [] });
    expect(mapServerErrors([42, null, { field: 'a' }])).toEqual({ fields: {}, form: [] });
  });
});
