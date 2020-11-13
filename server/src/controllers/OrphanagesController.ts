import { Request, Response } from 'express'
import { getRepository } from 'typeorm';

import Orphanage from '../models/Orphanage';
import orphanagesViews from '../views/orphanages-views';

import * as Yup from 'yup';

export default {
  async index(request: Request, response: Response) {
    const orphanagesRepository = getRepository(Orphanage);

    const orphanages = await orphanagesRepository.find({
      relations: ['images']
    });

    return response.json(orphanagesViews.renderMany(orphanages));
  },

  async show(request: Request, response: Response) {
    const { id } = request.params;
    const orphanagesRepository = getRepository(Orphanage);

    const orphanage = await orphanagesRepository.findOneOrFail(id, {
      relations: ['images']
    });

    return response.json(orphanagesViews.render(orphanage));
  },

  async create(request: Request, response: Response) {
    const {
      name,
      longitude,
      latitude,
      about,
      instructions,
      opening_hours,
      open_on_weekends,
    } = request.body;

    const orphanagesRepository = getRepository(Orphanage);
    const requestImages = request.files as Express.Multer.File[]; //forçando que isso é um array de arquivos

    const images = requestImages.map(image => {
      return { path: image.filename }
    });
    // validando dados
    const data = {
      name,
      longitude,
      latitude,
      about,
      instructions,
      opening_hours,
      open_on_weekends: open_on_weekends === 'true',
      images
    };
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      latitude: Yup.number().required(),
      longitude: Yup.number().required(),
      about: Yup.string().required().max(300),
      instructions: Yup.string().required(),
      opening_hours: Yup.string().required(),
      open_on_weekends: Yup.boolean().required(),
      images: Yup.array(
        Yup.object().shape({
          path: Yup.string().required()
        })
      )
    });

    await schema.validate(data, {
      abortEarly: false,
    });



    const orphanages = orphanagesRepository.create(data);
    await orphanagesRepository.save(orphanages);

    return response.status(201).json(orphanages);
  }
}