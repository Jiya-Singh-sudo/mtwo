import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { GuestsService } from './guests.service';
import { CreateGuestDto } from './dto/create-guests.dto';
import { UpdateGuestDto } from './dto/update-guests.dto';
import { getRequestContext } from '../../common/utlis/request-context.util';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('guests')
export class GuestsController {
  constructor(private readonly service: GuestsService) { }

  // @Get('active')
  // async active() {
  //   return this.service.findActiveGuestsWithInOut();
  // }
  @Get('active')
  async activeRows(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
    // @Query('sortOrder') sortOrder?: string,
    @Query('entryDateFrom') entryDateFrom?: string,
    @Query('entryDateTo') entryDateTo?: string,
  ) {
    return this.service.findActiveGuestsWithInOut({
      page: Number(page),
      limit: Number(limit),
      search,
      status,
      sortBy,
      // sortOrder,
      entryDateFrom,
      entryDateTo,
    });
  }

  // guests.controller.ts
  @Get('status-counts')
  async getStatusCounts() {
    return await this.service.getGuestStatusCounts();
  } 

  // create full guest (guest + designation + inout)
  @Post()
  @UseInterceptors(
    FileInterceptor('requestDoc', {
      storage: diskStorage({
        destination: './uploads/request_docs',
        filename: (req, file, cb) => {
          const uniqueName =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueName + extname(file.originalname));
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
          return cb(new BadRequestException('Only PDF allowed'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 500 * 1024,
      },
    }),
  )
  async createFull(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Req() req: any,
  ) {
    const { user, ip } = getRequestContext(req);

    // ✅ IMPORTANT: because multipart converts everything to string
    const parsedBody = {
      guest: JSON.parse(body.guest),
      designation: body.designation ? JSON.parse(body.designation) : undefined,
      inout: body.inout ? JSON.parse(body.inout) : undefined,
    };

    return this.service.createFullGuest(parsedBody, user, ip, file);
  }
  // @Post()
  // async createFull(@Body() body: { guest: CreateGuestDto; designation?: any; inout?: any }, @Req() req: any) {
  //   const { user, ip } = getRequestContext(req);
  //   return this.service.createFullGuest(body, user, ip);
  // }

  // patch guest data
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateGuestDto, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.update(String(id), dto, user, ip);  
  }

  // soft delete guest + optionally soft delete inout
  @Delete(':id')
  async softDelete(@Param('id') id: string, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    // soft delete all active inout rows for this guest
    await this.service.softDeleteGuest(String(id), user, ip);
    return this.service.softDeleteGuest(String(id), user, ip);
  }

  @Get('checked-in-without-vehicle')
  async getCheckedInWithoutVehicle() {
    return this.service.findCheckedInWithoutVehicle();
  }

  @Patch('inout/:id/exit')
  async exitGuest(@Param('id') id: string, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.updateGuestInOut(id, { status: 'Exited' }, user, ip);
  }

  @Patch('inout/:id/cancel')
  async cancelGuest(@Param('id') id: string, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.updateGuestInOut(id, { status: 'Cancelled' }, user, ip);
  }
  @Get(':guestId/transport-conflicts')
  getTransportConflicts(@Param('guestId') guestId: string) {
    return this.service.getTransportConflictsForGuest(guestId);
  }
}
