import { Controller, Get, Post, Param, Query, Res, Req } from '@nestjs/common';
import { InfoPackageService } from './info-package.service';
import { InfoPackageSearchDto } from './dto/info-package-search.dto';
import type { Response } from 'express';

@Controller('info-package')
export class InfoPackageController {
    constructor(private readonly service: InfoPackageService) { }

    // 1️⃣ Search guests for info package page
    @Get('guests')
    searchGuests(@Query() query: InfoPackageSearchDto) {
        return this.service.searchGuests(query);
    }

    // 2️⃣ Get full aggregated info of a guest
    @Get(':guestId')
    getGuestInfo(@Param('guestId') guestId: string) {
        return this.service.getGuestInfo(guestId);
    }

    // 3️⃣ Generate PDF (placeholder for now)
    @Post(':guestId/pdf')
    async generatePdf(
        @Param('guestId') guestId: string,
        @Res() res: Response,
    ) {
        const { fileName, buffer } = await this.service.generatePdf(guestId);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Content-Length': buffer.length,
        });

        res.end(buffer);
    }

    // 4️⃣ Send WhatsApp (placeholder for now)
    @Post(':guestId/whatsapp')
    async sendWhatsapp(
        @Param('guestId') guestId: string,
        @Req() req: any,
        ) {
        return this.service.sendWhatsapp(guestId, {
            performedBy: req.user?.username || 'unknown',
            ipAddress: req.ip,
        });
    }

}
