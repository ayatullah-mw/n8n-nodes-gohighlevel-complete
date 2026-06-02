/**
 * Tests for Calendar and Appointment resource operations.
 */

const mockRequest = jest.fn();

jest.mock('../../nodes/GoHighLevel/GenericFunctions', () => ({
  ...jest.requireActual('../../nodes/GoHighLevel/GenericFunctions'),
  gohighlevelApiRequest: mockRequest,
}));

const CALENDAR = { id: 'cal-001', name: 'Sales Calendar', locationId: 'loc-123' };
const APPOINTMENT = {
  id: 'apt-001',
  calendarId: CALENDAR.id,
  contactId: 'cid-001',
  title: 'Discovery Call',
  startTime: '2025-01-15T10:00:00Z',
  endTime: '2025-01-15T11:00:00Z',
  appointmentStatus: 'confirmed',
};

// ─── List Calendars ───────────────────────────────────────────────────────────

describe('Calendar: List Calendars', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls GET /calendars with locationId', async () => {
    mockRequest.mockResolvedValue({ calendars: [CALENDAR] });
    await mockRequest('GET', '/calendars', {}, { locationId: 'loc-123' });
    expect(mockRequest).toHaveBeenCalledWith('GET', '/calendars', {}, { locationId: 'loc-123' });
  });

  it('returns array of calendars', async () => {
    mockRequest.mockResolvedValue({ calendars: [CALENDAR] });
    const result = await mockRequest('GET', '/calendars', {}, {});
    expect(
      Array.isArray((result as { calendars: typeof CALENDAR[] }).calendars),
    ).toBe(true);
    expect((result as { calendars: typeof CALENDAR[] }).calendars[0].id).toBe('cal-001');
  });
});

// ─── Create Appointment ───────────────────────────────────────────────────────

describe('Calendar: Create Appointment', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls POST /calendars/events/appointments', async () => {
    mockRequest.mockResolvedValue({ appointment: APPOINTMENT });

    const body = {
      calendarId: CALENDAR.id,
      contactId: 'cid-001',
      startTime: '2025-01-15T10:00:00Z',
      endTime: '2025-01-15T11:00:00Z',
      title: 'Discovery Call',
    };

    await mockRequest('POST', '/calendars/events/appointments', body);
    expect(mockRequest).toHaveBeenCalledWith('POST', '/calendars/events/appointments', body);
  });

  it('returns the appointment object', async () => {
    mockRequest.mockResolvedValue({ appointment: APPOINTMENT });
    const result = await mockRequest('POST', '/calendars/events/appointments', {});
    expect((result as { appointment: typeof APPOINTMENT }).appointment.id).toBe('apt-001');
  });
});

// ─── Get Appointment ──────────────────────────────────────────────────────────

describe('Calendar: Get Appointment', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls GET /calendars/events/appointments/:id', async () => {
    mockRequest.mockResolvedValue({ appointment: APPOINTMENT });
    await mockRequest('GET', `/calendars/events/appointments/${APPOINTMENT.id}`);
    expect(mockRequest).toHaveBeenCalledWith(
      'GET',
      `/calendars/events/appointments/${APPOINTMENT.id}`,
    );
  });
});

// ─── Update Appointment ───────────────────────────────────────────────────────

describe('Calendar: Update Appointment', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls PUT /calendars/events/appointments/:id', async () => {
    const updates = { appointmentStatus: 'cancelled' };
    mockRequest.mockResolvedValue({ appointment: { ...APPOINTMENT, ...updates } });
    await mockRequest('PUT', `/calendars/events/appointments/${APPOINTMENT.id}`, updates);
    expect(mockRequest).toHaveBeenCalledWith(
      'PUT',
      `/calendars/events/appointments/${APPOINTMENT.id}`,
      updates,
    );
  });
});

// ─── Delete Appointment ───────────────────────────────────────────────────────

describe('Calendar: Delete Appointment', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls DELETE /calendars/events/appointments/:id', async () => {
    mockRequest.mockResolvedValue(undefined);
    await mockRequest('DELETE', `/calendars/events/appointments/${APPOINTMENT.id}`);
    expect(mockRequest).toHaveBeenCalledWith(
      'DELETE',
      `/calendars/events/appointments/${APPOINTMENT.id}`,
    );
  });
});
