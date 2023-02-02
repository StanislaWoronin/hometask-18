import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../src/app.module";
import { createApp } from "../src/helpers/create-app";
import request from "supertest";
import {preparedPost, preparedUser, superUser} from "./helper/prepeared-data";
import { v4 as uuidv4 } from 'uuid';
import {getPostsByBlogId} from "./helper/expect-post-models";

describe('e2e tests', () => {
  const second = 1000;
  jest.setTimeout(30 * second);

  let app: INestApplication;
  let server;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const rawApp = await moduleFixture.createNestApplication();
    app = createApp(rawApp);
    await app.init();
    server = await app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Public blogs', () => {
    it('Clear date base', async () => {
      await request(server)
        .delete(`/testing/all-data`)
        .expect(204)
    })

    it('Creat blogs', async () => {
      await request(server)
        .post(`/sa/users`)
        .send(preparedUser.valid1)
        .auth(superUser.valid.login, superUser.valid.password, { type: 'basic' })
        .expect(201)

      const token = await request(server)
        .post(`/auth/login`)
        .send(preparedUser.login1)
        .set({ 'user-agent': 'chrome/0.1' })
        .expect(200)

      const blog1 = await request(server)
        .post(`/blogger/blogs`)
        .send({
          name: 'BlogName5',
          description: 'valid description',
          websiteUrl: 'https://someUrl1.io/'
        })
        .set({Authorization: `Bearer ${token.body.accessToken}`})
        .expect(201)

      const blog2 = await request(server)
        .post(`/blogger/blogs`)
        .send({
          name: 'BlogName4',
          description: 'valid description',
          websiteUrl: 'https://someUrl2.io/'
        })
        .set({Authorization: `Bearer ${token.body.accessToken}`})
        .expect(201)

      const blog3 = await request(server)
        .post(`/blogger/blogs`)
        .send({
          name: 'BlogName3',
          description: 'valid description',
          websiteUrl: 'https://someUrl3.io/'
        })
        .set({Authorization: `Bearer ${token.body.accessToken}`})
        .expect(201)

      const blog4 = await request(server)
        .post(`/blogger/blogs`)
        .send({
          name: 'BlogName2',
          description: 'valid description',
          websiteUrl: 'https://someUrl4.io/'
        })
        .set({Authorization: `Bearer ${token.body.accessToken}`})
        .expect(201)

      const blog5 = await request(server)
        .post(`/blogger/blogs`)
        .send({
          name: 'BlogName1',
          description: 'valid description',
          websiteUrl: 'https://someUrl5.io/'
        })
        .set({Authorization: `Bearer ${token.body.accessToken}`})
        .expect(201)

      expect.setState({token: token.body})
      expect.setState({blog1: blog1.body})
      expect.setState({blog5: blog5.body})
      expect.setState({items1: [blog5.body, blog4.body, blog3.body, blog2.body, blog1.body]})
      expect.setState({items2: [blog2.body, blog1.body]})
      expect.setState({items3: [blog1.body, blog2.body, blog3.body]})
    })

    describe('Return blogs with paging', () => {
      it('Get blogs without query', async () => {
        const items = expect.getState().items1
        const response = await request(server)
          .get(`/blogs`)
          .expect(200)

        expect(response.body).toStrictEqual({
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 5,
          items: items
        })
      })

      it('Get blogs with sorting and paging', async () => {
        const items = expect.getState().items2
        const response = await request(server)
          .get(`/blogs?sortBy=name&sortDirection=asc&pageNumber=2&pageSize=3`)
          .expect(200)

        expect(response.body).toStrictEqual({
          pagesCount: 2,
          page: 2,
          pageSize: 3,
          totalCount: 5,
          items: items
        })
      })

      it('Get blogs with sorting and paging', async () => {
        const items = expect.getState().blog5
        const response = await request(server)
          .get(`/blogs?sortBy=websiteUrl&sortDirection=desc&pageSize=3`)
          .expect(200)

        expect(response.body).toBe({
          pagesCount: 2,
          page: 1,
          pageSize: 3,
          totalCount: 5,
          items: items
        })
      })

      it('Get blogs search name term', async () => {
        const items = expect.getState().blog5
        const response = await request(server)
          .get(`/blogs?searchNameTerm=1`)
          .expect(200)

        expect(response.body).toStrictEqual({
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 1,
          items: [items]
        })
      })
    })

    describe('Return all posts for specified blog', () => {
      it('Create posts', async () => {
        const token = expect.getState().token
        const blog1 = expect.getState().blog1
        const blog2 = expect.getState().blog5

        await request(server)
          .post(`/blogger/blogs/${blog2.id}/posts`)
          .send(preparedPost.valid)
          .set({Authorization: `Bearer ${token.accessToken}`})
          .expect(201)

        const post1 = await request(server)
          .post(`/blogger/blogs/${blog1.id}/posts`)
          .send({
            title: 'PostName1',
            shortDescription: 'SomeOneShortDescription1',
            content: 'SomeOneContent3'
          })
          .set({Authorization: `Bearer ${token.accessToken}`})
          .expect(201)

        const post2 = await request(server)
          .post(`/blogger/blogs/${blog1.id}/posts`)
          .send({
            title: 'PostName2',
            shortDescription: 'SomeOneShortDescription2',
            content: 'SomeOneContent2'
          })
          .set({Authorization: `Bearer ${token.accessToken}`})
          .expect(201)

        const post3 = await request(server)
          .post(`/blogger/blogs/${blog1.id}/posts`)
          .send({
            title: 'PostName3',
            shortDescription: 'SomeOneShortDescription3',
            content: 'SomeOneContent1'
          })
          .set({Authorization: `Bearer ${token.accessToken}`})
          .expect(201)

        expect.setState({items1: [post3.body, post2.body, post1.body]})
      })

      it('Return all post without query', async () => {
        const blog = expect.getState().blog1
        const item = expect.getState().items1

        const response = await request(server)
          .get(`/blogs/${blog.id}/posts`)
          .expect(200)

        expect(response.body).toStrictEqual({
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 3,
          items: [
            getPostsByBlogId(3, 3, blog),
            getPostsByBlogId(2, 3, blog),
            getPostsByBlogId(1, 3, blog)
          ]
        })
      })

      it('Return all post with sorting and pagination', async () => {
        const blog = expect.getState().blog1

        const response = await request(server)
          .get(`/blogs/${blog.id}/posts?sortBy=title&sortDirection=asc&pageNumber=2&pageSize=2`)
          .expect(200)

        expect(response.body).toStrictEqual({
          pagesCount: 2,
          page: 2,
          pageSize: 2,
          totalCount: 3,
          items: [
            getPostsByBlogId(3, 3, blog)
          ]
        })
      })

      it('Return all post with sorting and pagination', async () => {
        const blog1 = expect.getState().blog1

        const response = await request(server)
          .get(`/blogs/${blog1.id}/posts?sortBy=content&sortDirection=desc&pageSize=2`)
          .expect(200)

        expect(response.body).toBe({
          pagesCount: 1,
          page: 1,
          pageSize: 10,
          totalCount: 3,
          items: [
            getPostsByBlogId(3, 3, blog1),
            getPostsByBlogId(2, 3, blog1),
          ]
        })
      })
    })

    describe('Return blog by id', () => {
      const randomUuid = uuidv4()

      it('Try find not exist blog', async () => {
        await request(server)
          .get(`/blogs/${randomUuid}`)
          .expect(404)
      })

      it('Should return blog by id', async () => {
        const blog = expect.getState().blog1

        const response = await request(server)
          .get(`/blogs/${blog.id}`)
          .expect(200)

        expect(response.body).toStrictEqual({
          id: expect.any(String),
          name: blog.name,
          description: blog.description,
          websiteUrl: blog.websiteUrl
        })
      })
    })
  })
});