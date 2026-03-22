// services/course-service/src/validators/course.validator.js
const Joi = require('joi');

const createCourseSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(20).max(5000).required(),
  price: Joi.number().min(0).max(9999).required(),
  level: Joi.string().valid('BEGINNER', 'INTERMEDIATE', 'ADVANCED').default('BEGINNER'),
  categoryId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  thumbnail: Joi.string().uri().optional()
});

const updateCourseSchema = Joi.object({
  title: Joi.string().min(5).max(200).optional(),
  description: Joi.string().min(20).max(5000).optional(),
  price: Joi.number().min(0).max(9999).optional(),
  level: Joi.string().valid('BEGINNER', 'INTERMEDIATE', 'ADVANCED').optional(),
  status: Joi.string().valid('DRAFT', 'PUBLISHED', 'ARCHIVED').optional(),
  categoryId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional()
});

const createModuleSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(1000).optional(),
  order: Joi.number().min(0).required()
});

const createLessonSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(1000).optional(),
  type: Joi.string().valid('VIDEO', 'TEXT', 'QUIZ').default('VIDEO'),
  content: Joi.string().required(),
  duration: Joi.number().min(0).optional(),
  order: Joi.number().min(0).required(),
  isFree: Joi.boolean().default(false)
});

const updateProgressSchema = Joi.object({
  lessonId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  completed: Joi.boolean().required()
});

module.exports = {
  createCourseSchema,
  updateCourseSchema,
  createModuleSchema,
  createLessonSchema,
  updateProgressSchema
};