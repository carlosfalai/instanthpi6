import React from 'react';
import { useForm } from 'react-hook-form';
import AppLayoutSpruce from '@/components/layout/AppLayoutSpruce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Building, MapPin, Phone, Mail, Globe, Image } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export default function OrganizationProfilePage() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: 'Centre Médical Font',
      email: 'info@centremfont.com',
      phone: '+1 (450) 444-1234',
      address: '123 Rue Principale',
      city: 'La Prairie',
      state: 'Québec',
      postalCode: 'J5R 1A1',
      country: 'Canada',
      website: 'https://centremfont.com',
      description: 'Family medicine practice specializing in comprehensive care for all ages.',
    }
  });

  const onSubmit = (data: any) => {
    console.log('Form submitted:', data);
    // Here you would save the form data to your backend
  };

  return (
    <AppLayoutSpruce>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Organization Profile</h1>
            <p className="text-gray-400 mt-1">
              Update your organization's basic information
            </p>
          </div>
          <Button variant="default" className="bg-blue-600 hover:bg-blue-700">
            Save Changes
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="bg-[#1e1e1e] border-[#333]">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Building className="h-5 w-5 mr-2" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  This information will be displayed publicly on your profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Organization Name</Label>
                      <Input
                        id="name"
                        className="bg-[#252525] border-[#444]"
                        {...register('name', { required: 'Name is required' })}
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1">{errors.name.message as string}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        className="bg-[#252525] border-[#444] min-h-[100px]"
                        {...register('description')}
                      />
                    </div>

                    <Separator className="my-6 bg-[#333]" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email" className="flex items-center">
                          <Mail className="h-4 w-4 mr-1" /> Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          className="bg-[#252525] border-[#444]"
                          {...register('email', { required: 'Email is required' })}
                        />
                        {errors.email && (
                          <p className="text-red-500 text-sm mt-1">{errors.email.message as string}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="phone" className="flex items-center">
                          <Phone className="h-4 w-4 mr-1" /> Phone
                        </Label>
                        <Input
                          id="phone"
                          className="bg-[#252525] border-[#444]"
                          {...register('phone', { required: 'Phone is required' })}
                        />
                        {errors.phone && (
                          <p className="text-red-500 text-sm mt-1">{errors.phone.message as string}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="website" className="flex items-center">
                        <Globe className="h-4 w-4 mr-1" /> Website
                      </Label>
                      <Input
                        id="website"
                        className="bg-[#252525] border-[#444]"
                        {...register('website')}
                      />
                    </div>

                    <Separator className="my-6 bg-[#333]" />

                    <Label className="flex items-center mb-4">
                      <MapPin className="h-4 w-4 mr-1" /> Address
                    </Label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="address">Street Address</Label>
                        <Input
                          id="address"
                          className="bg-[#252525] border-[#444]"
                          {...register('address', { required: 'Address is required' })}
                        />
                        {errors.address && (
                          <p className="text-red-500 text-sm mt-1">{errors.address.message as string}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          className="bg-[#252525] border-[#444]"
                          {...register('city', { required: 'City is required' })}
                        />
                        {errors.city && (
                          <p className="text-red-500 text-sm mt-1">{errors.city.message as string}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="state">State/Province</Label>
                        <Input
                          id="state"
                          className="bg-[#252525] border-[#444]"
                          {...register('state', { required: 'State/Province is required' })}
                        />
                        {errors.state && (
                          <p className="text-red-500 text-sm mt-1">{errors.state.message as string}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="postalCode">Postal/Zip Code</Label>
                        <Input
                          id="postalCode"
                          className="bg-[#252525] border-[#444]"
                          {...register('postalCode', { required: 'Postal/Zip Code is required' })}
                        />
                        {errors.postalCode && (
                          <p className="text-red-500 text-sm mt-1">{errors.postalCode.message as string}</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          className="bg-[#252525] border-[#444]"
                          {...register('country', { required: 'Country is required' })}
                        />
                        {errors.country && (
                          <p className="text-red-500 text-sm mt-1">{errors.country.message as string}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="border-t border-[#333] flex justify-end pt-4">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div>
            <Card className="bg-[#1e1e1e] border-[#333] mb-6">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Image className="h-5 w-5 mr-2" />
                  Logo
                </CardTitle>
                <CardDescription>
                  Your organization's logo will be displayed on patient communications
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <Avatar className="h-32 w-32 mb-4">
                  <AvatarImage src="/placeholder-logo.png" alt="Centre Médical Font" />
                  <AvatarFallback className="bg-blue-900 text-2xl">CMF</AvatarFallback>
                </Avatar>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Upload New
                  </Button>
                  <Button variant="destructive" size="sm">
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1e1e1e] border-[#333]">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  About This Page
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm">
                  This page demonstrates the Organization Profile settings using the Spruce-like layout. 
                  Notice how the middle panel shows contextual navigation for "Settings" when you select Settings 
                  from the left sidebar, and the main content area displays the form.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayoutSpruce>
  );
}