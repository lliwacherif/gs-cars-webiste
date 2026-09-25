import {
  Controller, Get, Put, Delete, Param,
  Body, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
  ApiParam, ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth('JWT')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Returns all registered users.
   * Restricted to admins only.
   */
  @Get()
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] List all users', description: 'Returns every user in the system. Admin only.' })
  @ApiResponse({ status: 200, description: 'Array of user objects (passwords excluded)' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin role required' })
  findAll() {
    return this.usersService.findAll();
  }

  /**
   * Returns a single user by MongoDB ID.
   * Admins can fetch any user; customers can only fetch their own.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID', description: 'Admins can fetch any user; customers their own profile.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the user' })
  @ApiResponse({ status: 200, description: 'User object (password excluded)' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  /**
   * Updates a user's profile fields (excluding password).
   * Admins can update any user; customers can only update their own profile.
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update user profile', description: 'Partial update of user fields (no password). Customers can only update their own.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the user to update' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Updated user object' })
  @ApiResponse({ status: 403, description: 'Forbidden — cannot update another user\'s profile' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('_id') requesterId: string,
    @CurrentUser('role') requesterRole: string,
  ) {
    return this.usersService.update(id, dto, requesterId, requesterRole);
  }

  /**
   * Permanently deletes a user.
   * Restricted to admins only.
   */
  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Delete a user', description: 'Permanently removes a user from the database. Admin only.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the user to delete' })
  @ApiResponse({ status: 200, description: '{ message: "User deleted successfully" }' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
