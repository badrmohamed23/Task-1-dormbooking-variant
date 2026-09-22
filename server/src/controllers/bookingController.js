  import { Booking } from '../models/Booking.js';
  import Joi from 'joi';
  


// TODO: write a validation schema for create/update per README.md section 2.

const createSchema = Joi.object({
  roomNumber: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required(),
  purpose: Joi.string().optional(),
  bookedBy: Joi.string().hex().length(24).optional()
});



const updateSchema = Joi.object({
  roomNumber: Joi.string(),
  startDate: Joi.date(),
  endDate: Joi.date(),
  purpose: Joi.string(),
  bookedBy: Joi.string().hex().length(24)
}).min(1).custom((value, helpers) => {
  if (value.startDate && value.endDate && value.startDate >= value.endDate) {
    return helpers.error('date.order');
  }
  return value;
}).messages({
  'date.order': 'startDate must be before endDate'
});


// TODO: per README.md section 4, you will need a way to detect whether a
// proposed booking conflicts with an existing one on the same room.

// GET /api/bookings
// TODO: implement per README.md section 3.
export async function getAllBookings(req, res, next) {
  try {
    // TODO
    const bookings = await Booking.find().populate('bookedBy').sort({ createdAt: -1 }).lean();
    res.json({ bookings });
  } catch (err) { next(err); }
}

// GET /api/bookings/:id
// TODO: implement per README.md sections 3 and 5.
export async function getBooking(req, res, next) {
  try {
    // TODO
    const booking =await Booking.findById(req.params.id).populate('bookedBy').lean();
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json({ booking });
  } catch (err) { next(err); }
}

// POST /api/bookings
// TODO: implement per README.md sections 3 and 4.
export async function createBooking(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const conflict = await Booking.findOne({ roomNumber :value.roomNumber,
      startDate: { $lt: value.endDate },
      endDate: { $gt: value.startDate } });
    if (conflict) return res.status(409).json({ message: 'Booking conflict' });

    const booking = await Booking.create(value);
    res.status(201).json({ booking });
    // TODO
  } catch (err) { next(err); }
}

// PATCH /api/bookings/:id
// TODO: implement per README.md sections 3, 4, and 5.
export async function updateBooking(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    
    const existing = await Booking.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Booking not found' });

    
    const roomNumber = value.roomNumber ?? existing.roomNumber;
    const startDate = value.startDate ? new Date(value.startDate) : existing.startDate;
    const endDate = value.endDate ? new Date(value.endDate) : existing.endDate;
    if (startDate >= endDate) return res.status(400).json({ message: 'startDate must be before endDate' });

   
    const conflict = await Booking.findOne({
      _id: { $ne: req.params.id },
      roomNumber,
      startDate: { $lt: endDate },
      endDate: { $gt: startDate }
    });
    if (conflict) return res.status(409).json({ message: 'Booking conflict' });

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      { new: true, runValidators: true }
    ).populate('bookedBy');

    res.json({ booking });
  } catch (err) { next(err); }
}

// DELETE /api/bookings/:id
// TODO: implement per README.md sections 3 and 5.
export async function deleteBooking(req, res, next) {
  try {
    // TODO
    const doc = await Booking.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Booking not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
}
